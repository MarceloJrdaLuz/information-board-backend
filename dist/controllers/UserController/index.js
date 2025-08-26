"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const userRepository_1 = require("../../repositories/userRepository");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const typeorm_1 = require("typeorm");
const roleRepository_1 = require("../../repositories/roleRepository");
const uuid_1 = require("uuid");
//@ts-expect-error
const mailer_1 = __importDefault(require("../../modules/mailer"));
const config_1 = require("../../config");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const congregationRepository_1 = require("../../repositories/congregationRepository");
const permissions_1 = require("../../middlewares/permissions");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
class UserController {
    async create(req, res) {
        var _a;
        const { email, password, fullName } = req.body;
        const userExists = await userRepository_1.userRepository.findOneBy({ email });
        const role = await roleRepository_1.roleRepository.findBy({ name: "USER" });
        if (userExists) {
            throw new api_errors_1.BadRequestError('E-mail already exists');
        }
        let generateUserCode = (0, uuid_1.v4)().substring(0, 8).toUpperCase();
        do {
            // generateUserCode
        } while (await userRepository_1.userRepository.findOneBy({ code: generateUserCode }));
        const hashPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = userRepository_1.userRepository.create({
            email,
            password: hashPassword,
            fullName,
            code: generateUserCode,
            roles: role
        });
        await userRepository_1.userRepository.save(newUser);
        const { password: _, ...user } = newUser;
        const token = jsonwebtoken_1.default.sign({ id: user.id }, (_a = process.env.JWT_PASS) !== null && _a !== void 0 ? _a : '', {
            subject: user.id,
            expiresIn: '8h'
        });
        const code = generateUserCode;
        mailer_1.default.sendMail({
            to: email,
            from: process.env.NODEMAILER_USER,
            subject: 'Cadastro efetuado com sucesso!',
            template: 'register/register_success',
            context: { code }
        }, (err) => {
            if (err) {
                console.log(err);
                return res.status(400).send({ error: 'Cannot send forgot email' });
            }
            return res.status(201).json({ user, token });
        });
    }
    async login(req, res) {
        var _a;
        const { email, password } = req.body;
        const user = await userRepository_1.userRepository.find({
            where: { email },
            relations: ['congregation', 'profile']
        });
        if (!user || user.length === 0) {
            throw new api_errors_1.BadRequestError('E-mail não cadastrado');
        }
        const foundUser = user[0];
        const verifyPass = await bcryptjs_1.default.compare(password, foundUser.password);
        if (!verifyPass) {
            throw new api_errors_1.BadRequestError('Senha inválida');
        }
        const token = jsonwebtoken_1.default.sign({ id: foundUser.id }, (_a = process.env.JWT_PASS) !== null && _a !== void 0 ? _a : '', {
            subject: foundUser.id,
            expiresIn: '30d'
        });
        const { password: _, ...userLogin } = foundUser;
        return res.json({
            user: userLogin,
            token
        });
    }
    async updateRoles(req, res) {
        var _a;
        const { user_id, roles } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new api_errors_1.UnauthorizedError('No token provided');
        }
        const parts = authHeader.split(' ');
        const [scheme, token] = parts;
        const jwtPass = (_a = process.env.JWT_PASS) !== null && _a !== void 0 ? _a : "";
        let userId;
        jsonwebtoken_1.default.verify(token, jwtPass, (err, decoded) => {
            var _a;
            if (err) {
                throw new api_errors_1.UnauthorizedError('Token invalid');
            }
            userId = (_a = decoded === null || decoded === void 0 ? void 0 : decoded.sub) === null || _a === void 0 ? void 0 : _a.toString();
        });
        const userRequest = await userRepository_1.userRepository.findOneBy({ id: userId });
        const isAdmin = userRequest === null || userRequest === void 0 ? void 0 : userRequest.roles.some(role => role.name === "ADMIN");
        const userToUpdate = await userRepository_1.userRepository.findOneBy({ id: user_id });
        const rolesExists = await roleRepository_1.roleRepository.findBy({ id: (0, typeorm_1.In)(roles) });
        const updateToAdmin = rolesExists.some(r => r.name === 'ADMIN'); //apenas ADMIN pode promover a ADMIN
        if (!rolesExists) {
            throw new api_errors_1.NotFoundError('Any role not found');
        }
        if (updateToAdmin && !isAdmin) {
            throw new api_errors_1.UnauthorizedError('Unauthorized to promove user to ADMIN');
        }
        const userUpdate = {
            ...userToUpdate,
            roles: [...rolesExists]
        };
        const updated = await userRepository_1.userRepository.save(userUpdate);
        return res.status(201).json({ updated });
    }
    async recoverUserInformation(req, res) {
        var _a;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new api_errors_1.UnauthorizedError('No token provided');
        }
        const parts = authHeader.split(' ');
        const [scheme, token] = parts;
        const jwtPass = (_a = process.env.JWT_PASS) !== null && _a !== void 0 ? _a : "";
        let userId;
        jsonwebtoken_1.default.verify(token, jwtPass, (err, decoded) => {
            var _a;
            if (err) {
                throw new api_errors_1.UnauthorizedError('Token invalid');
            }
            userId = (_a = decoded === null || decoded === void 0 ? void 0 : decoded.sub) === null || _a === void 0 ? void 0 : _a.toString();
        });
        const user = await userRepository_1.userRepository.findOne({
            where: { id: userId },
            relations: ['congregation', 'profile']
        });
        if (!user) {
            throw new api_errors_1.BadRequestError('E-mail não cadastrado');
        }
        const { password: _, ...userLogin } = user;
        return res.status(200).json(userLogin);
    }
    async forgot_password(req, res) {
        const { email } = req.body;
        const user = await userRepository_1.userRepository.findOneBy({ email });
        if (!user) {
            throw new api_errors_1.BadRequestError(`User wasn't found`);
        }
        const token = (0, uuid_1.v4)();
        const now = moment_timezone_1.default.tz('America/Sao_Paulo');
        console.log(now);
        const expiredToken = now.add(1, 'hour');
        await userRepository_1.userRepository.save({
            ...user,
            passwordResetToken: token,
            passwordResetExpires: expiredToken.toString()
        });
        const urlApi = config_1.config.app_url;
        mailer_1.default.sendMail({
            to: email,
            from: process.env.NODEMAILER_USER,
            subject: 'Redefinição de Senha',
            template: 'auth/forgot-password',
            context: { token, email, urlApi }
        }, (err) => {
            if (err) {
                console.log(err);
                return res.status(400).send({ error: 'Cannot send forgot password email' });
            }
            return res.send();
        });
    }
    async reset_password(req, res) {
        const { email, newPassword, token } = req.body;
        const user = await userRepository_1.userRepository.findOneBy({
            email
        });
        if (!user) {
            throw new api_errors_1.BadRequestError('User not found');
        }
        if (token !== user.passwordResetToken) {
            throw new api_errors_1.BadRequestError('Token invalid');
        }
        const now = moment_timezone_1.default.tz('America/Sao_Paulo');
        const date = new Date(user.passwordResetExpires);
        const expiredToken = (0, moment_timezone_1.default)(date);
        if (now > expiredToken) {
            throw new api_errors_1.BadRequestError('Token expired, generate a new one');
        }
        const hashPassword = await bcryptjs_1.default.hash(newPassword, 10);
        const updateUser = userRepository_1.userRepository.create({
            ...user,
            //@ts-expect-error
            password: hashPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        });
        await userRepository_1.userRepository.save(updateUser);
        const { password: _, ...userResponse } = updateUser;
        return res.status(200).json(userResponse);
    }
    async generatedCodeAllUsers(req, res) {
        const users = await userRepository_1.userRepository.find();
        for (const user of users) {
            let generateUserCode = (0, uuid_1.v4)().substring(0, 8);
            do {
                // generateUserCode
            } while (await userRepository_1.userRepository.findOneBy({ code: generateUserCode }));
            user.code = generateUserCode;
            await userRepository_1.userRepository.save(user);
        }
        res.send().end();
    }
    async addUserDomain(req, res) {
        const { congregation_number, user_code: code } = req.body;
        const requestByUserId = await (0, permissions_1.decoder)(req);
        const user = await userRepository_1.userRepository.findOneBy({ code });
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ number: congregation_number });
        if (!user) {
            throw new api_errors_1.BadRequestError('User code not exists');
        }
        if (!congregation) {
            throw new api_errors_1.BadRequestError('Congregation not exists');
        }
        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN_CONGREGATION') {
            const requestUserIsCongregation = await userRepository_1.userRepository.findOne({
                where: {
                    congregation: {
                        number: congregation_number
                    },
                    id: requestByUserId.id
                }
            });
            if (!requestUserIsCongregation) {
                throw new api_errors_1.UnauthorizedError('The user making the request is attempting to add a user to a domain that does not belong to their congregation.');
            }
        }
        user.congregation = congregation;
        await userRepository_1.userRepository.save(user).then(() => {
            return res.send({ message: `User add congregation ${congregation.name} de ${congregation.city}` });
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Internal server error, check the logs' }).end();
        });
    }
    async linkPublisherToUser(req, res) {
        var _a;
        const { user_id } = req.params;
        const { publisher_id, force } = req.body;
        const user = await userRepository_1.userRepository.findOne({ where: { id: user_id }, relations: ["publisher"] });
        const publisher = await publisherRepository_1.publisherRepository.findOne({ where: { id: publisher_id }, relations: ["user"] });
        if (!user || !publisher) {
            throw new api_errors_1.NotFoundError("User or Publisher not found");
        }
        if (publisher_id !== ((_a = user.publisher) === null || _a === void 0 ? void 0 : _a.id)) { // se for o mesmo publisher não precisa fazer nada
            if (!force) {
                return res.status(409).json({
                    message: "Publisher already linked to another user. Use force to override.",
                });
            }
        }
        user.publisher = publisher;
        await userRepository_1.userRepository.save(user);
        return res.json({ message: "Publisher linked successfully" });
    }
    async unlinkPublisherFromUser(req, res) {
        const { user_id } = req.params;
        const user = await userRepository_1.userRepository.findOne({
            where: { id: user_id },
            relations: ["publisher"]
        });
        if (!user) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.user);
        }
        if (!user.publisher) {
            throw new api_errors_1.BadRequestError("This user is not linked to any publisher");
        }
        // remove vínculo
        user.publisher = null;
        await userRepository_1.userRepository.save(user);
        return res.json({ message: "Publisher unlinked successfully" });
    }
    async getUsers(req, res) {
        const requestByUserId = await (0, permissions_1.decoder)(req);
        const usersResponse = [];
        const isAdmin = requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN';
        const isAdminCongregation = requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN_CONGREGATION';
        if (isAdminCongregation) {
            const requestUser = await userRepository_1.userRepository.findOne({
                where: {
                    id: requestByUserId.id
                }
            });
            if (requestUser) {
                const users = await userRepository_1.userRepository.find({
                    where: {
                        congregation: {
                            id: requestUser.congregation.id
                        }
                    },
                    select: ["id", "email"]
                });
                if (users)
                    usersResponse.push(...users);
            }
        }
        if (isAdmin) {
            const users = await userRepository_1.userRepository.find({ select: ["id", "email"] });
            usersResponse.push(...users);
        }
        if (!usersResponse) {
            throw new api_errors_1.NotFoundError('Users not found');
        }
        const usersFilter = [];
        if (isAdminCongregation) {
            const filter = usersResponse.filter(user => {
                return (user.id !== requestByUserId.id &&
                    (!user.roles || !user.roles.some(role => role.name === "ADMIN")));
            });
            usersFilter.push(...filter);
        }
        if (isAdmin) {
            const filter = usersResponse.filter(user => user.id !== requestByUserId.id);
            usersFilter.push(...filter);
        }
        res.send(usersFilter);
    }
}
exports.default = new UserController();
