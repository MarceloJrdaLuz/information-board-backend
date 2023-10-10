import { Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { userRepository } from "../../repositories/userRepository";
import { BodyAddDomainsTypes, BodyResetPasswordTypes, BodyUserCreateTypes, BodyUserLoginTypes, BodyUserUpdateTypes } from "./types";
import bcrypt from 'bcryptjs'
import jwt, { decode } from 'jsonwebtoken'
import { In, Not, Any } from "typeorm";
import { roleRepository } from "../../repositories/roleRepository";
import { v4 } from "uuid";
//@ts-expect-error
import mailer from '../../modules/mailer'
import { config } from "../../config";
import moment from 'moment-timezone'
import { Request } from "express-serve-static-core";
import { congregationRepository } from "../../repositories/congregationRepository";
import { CustomRequest } from "../../types/customRequest";
import { decoder } from "../../middlewares/permissions";
import { User } from "../../entities/User";

class UserController {
    async create(req: CustomRequest<BodyUserCreateTypes>, res: Response) {
        const { email, password, fullName } = req.body

        const userExists = await userRepository.findOneBy({ email })

        const role = await roleRepository.findBy({ name: "USER" })

        if (userExists) {
            throw new BadRequestError('E-mail already exists')
        }

        let generateUserCode = v4().substring(0, 8).toUpperCase()

        do {
            // generateUserCode
        } while (await userRepository.findOneBy({ code: generateUserCode }))

        const hashPassword = await bcrypt.hash(password, 10)

        const newUser = userRepository.create({
            email,
            password: hashPassword,
            fullName,
            code: generateUserCode,
            roles: role
        })

        await userRepository.save(newUser)

        const { password: _, ...user } = newUser

        const token = jwt.sign({ id: user.id }, process.env.JWT_PASS ?? '', {
            subject: user.id,
            expiresIn: '8h'
        })

        const code = generateUserCode

        mailer.sendMail({
            to: email,
            from: process.env.NODEMAILER_USER,
            subject: 'Cadastro efetuado com sucesso!',
            template: 'register/register_success',
            context: { code }
        }, (err: any) => {
            if (err) {
                console.log(err)
                return res.status(400).send({ error: 'Cannot send forgot email' })
            }
            return res.status(201).json({ user, token })
        })

    }

    async login(req: CustomRequest<BodyUserLoginTypes>, res: Response) {
        const { email, password } = req.body

        const user = await userRepository.find({
            where: { email },
            relations: ['congregation']
        })


        if (!user || user.length === 0) {
            throw new BadRequestError('E-mail não cadastrado')
        }

        const foundUser = user[0]

        const verifyPass = await bcrypt.compare(password, foundUser.password)

        if (!verifyPass) {
            throw new BadRequestError('Senha inválida')
        }

        const token = jwt.sign({ id: foundUser.id }, process.env.JWT_PASS ?? '', {
            subject: foundUser.id,
            expiresIn: '8h'
        })

        const { password: _, ...userLogin } = foundUser

        return res.json({
            user: userLogin,
            token
        })
    }

    async updateRoles(req: CustomRequest<BodyUserUpdateTypes>, res: Response) {
        const { user_id, roles } = req.body

        const authHeader = req.headers.authorization

        if (!authHeader) {
            throw new UnauthorizedError('No token provided')
        }

        const parts = authHeader.split(' ')


        const [scheme, token] = parts


        const jwtPass = process.env.JWT_PASS ?? ""

        let userId

        jwt.verify(token, jwtPass, (err, decoded) => {
            if (err) {
                throw new UnauthorizedError('Token invalid')
            }

            userId = decoded?.sub?.toString()
        })

        const userRequest = await userRepository.findOneBy({ id: userId })

        const isAdmin = userRequest?.roles.some(role => role.name === "ADMIN")

        const userToUpdate = await userRepository.findOneBy({ id: user_id })

        const rolesExists = await roleRepository.findBy({ id: In(roles) })

        const updateToAdmin = rolesExists.some(r => r.name === 'ADMIN') //apenas ADMIN pode promover a ADMIN

        if (!rolesExists) {
            throw new NotFoundError('Any role not found')
        }

        if (updateToAdmin && !isAdmin) {
            throw new UnauthorizedError('Unauthorized to promove user to ADMIN')
        }

        const userUpdate = {
            ...userToUpdate,
            roles: [...rolesExists]
        }

        const updated = await userRepository.save(userUpdate)

        return res.status(201).json({ updated })
    }

    async recoverUserInformation(req: Request, res: Response) {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            throw new UnauthorizedError('No token provided')
        }

        const parts = authHeader.split(' ')

        const [scheme, token] = parts

        const jwtPass = process.env.JWT_PASS ?? ""

        let userId

        jwt.verify(token, jwtPass, (err, decoded) => {
            if (err) {
                throw new UnauthorizedError('Token invalid')
            }

            userId = decoded?.sub?.toString()
        })

        const user = await userRepository.find({
            where: { id: userId },
            relations: ['congregation']
        })


        if (!user || user.length === 0) {
            throw new BadRequestError('E-mail não cadastrado')
        }

        const foundUser = user[0]

        const { password: _, ...userLogin } = foundUser


        return res.status(200).json(userLogin)
    }

    async forgot_password(req: CustomRequest<{ email: string }>, res: Response) {
        const { email } = req.body

        const user = await userRepository.findOneBy({ email })

        if (!user) {
            throw new BadRequestError(`User wasn't found`)
        }

        const token = v4()

        const now = moment.tz('America/Sao_Paulo')
        console.log(now)

        const expiredToken = now.add(1, 'hour')

        await userRepository.save({
            ...user,
            passwordResetToken: token,
            passwordResetExpires: expiredToken.toString()
        })

        const urlApi = config.app_url

        mailer.sendMail({
            to: email,
            from: process.env.NODEMAILER_USER,
            subject: 'Redefinição de Senha',
            template: 'auth/forgot-password',
            context: { token, email, urlApi }
        }, (err: any) => {
            if (err) {
                console.log(err)
                return res.status(400).send({ error: 'Cannot send forgot password email' })
            }

            return res.send()
        })
    }

    async reset_password(req: CustomRequest<BodyResetPasswordTypes>, res: Response) {
        const { email, newPassword, token } = req.body

        const user = await userRepository.findOneBy({
            email
        })

        if (!user) {
            throw new BadRequestError('User not found')
        }

        if (token !== user.passwordResetToken) {
            throw new BadRequestError('Token invalid')
        }

        const now = moment.tz('America/Sao_Paulo')

        const date = new Date(user.passwordResetExpires)

        const expiredToken = moment(date)

        if (now > expiredToken) {
            throw new BadRequestError('Token expired, generate a new one')
        }

        const hashPassword = await bcrypt.hash(newPassword, 10)

        const updateUser = userRepository.create({
            ...user,
            //@ts-expect-error
            password: hashPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        })

        await userRepository.save(updateUser)

        const { password: _, ...userResponse } = updateUser

        return res.status(200).json(userResponse)
    }

    async generatedCodeAllUsers(req: Request, res: Response) {

        const users = await userRepository.find()


        for (const user of users) {
            let generateUserCode = v4().substring(0, 8)

            do {
                // generateUserCode
            } while (await userRepository.findOneBy({ code: generateUserCode }))

            user.code = generateUserCode

            await userRepository.save(user)
        }

        res.send().end()
    }

    async addUserDomain(req: CustomRequest<BodyAddDomainsTypes>, res: Response) {
        const { congregation_number, user_code: code } = req.body

        const requestByUserId = await decoder(req)

        const user = await userRepository.findOneBy({ code })

        const congregation = await congregationRepository.findOneBy({ number: congregation_number })

        if (!user) {
            throw new BadRequestError('User code not exists')
        }

        if (!congregation) {
            throw new BadRequestError('Congregation not exists')
        }

        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN_CONGREGATION') {
            const requestUserIsCongregation = await userRepository.findOne({
                where: {
                    congregation: {
                        number: congregation_number
                    },
                    id: requestByUserId.id
                }
            })

            if (!requestUserIsCongregation) {
                throw new UnauthorizedError('The user making the request is attempting to add a user to a domain that does not belong to their congregation.')
            }
        }

        user.congregation = congregation

        await userRepository.save(user).then(() => {
            return res.send({ message: `User add congregation ${congregation.name} de ${congregation.city}` })
        }).catch(err => {
            console.log(err)
            res.status(500).send({ message: 'Internal server error, check the logs' }).end()
        })
    }

    async getUsers(req: Request, res: Response) {
        const requestByUserId = await decoder(req)

        const usersResponse: User[] = []

        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN_CONGREGATION') {
            const requestUser = await userRepository.findOne({
                where: {
                    id: requestByUserId.id
                }
            })

            if (requestUser) {
                const users = await userRepository.find({
                    where: {
                        congregation: {
                            id: requestUser.congregation.id
                        }
                    },
                    select: ["id", "email"]
                })

                if (users) usersResponse.push(...users)
            }
        }

        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN') {
            const users = await userRepository.find({ select: ["id", "email"] })

            usersResponse.push(...users)

        }

        if (!usersResponse) {
            throw new NotFoundError('Users not found')
        }

        const usersFilter = usersResponse.filter(user => user.roles.some(role => role.name !== "ADMIN"))

        return res.status(200).json(usersFilter)
    }
}

export default new UserController()