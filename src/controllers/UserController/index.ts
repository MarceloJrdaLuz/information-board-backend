import { Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { userRepository } from "../../repositories/userRepository";
import { BodyRecoverUserInformationTypes, BodyUserCreateTypes, BodyUserLoginTypes, BodyUserUpdateTypes, CustomRequest } from "./type";
import bcrypt from 'bcrypt'
import jwt, { decode } from 'jsonwebtoken'
import { In } from "typeorm";
import { roleRepository } from "../../repositories/roleRepository";

class UserController {
    async create(req: CustomRequest<BodyUserCreateTypes>, res: Response) {
        const { email, password, roles } = req.body

        const userExists = await userRepository.findOneBy({ email })

        const role = await roleRepository.findBy({ name: "USER" })

        if (userExists) {
            throw new BadRequestError('E-mail já cadastrado')
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const newUser = userRepository.create({
            email,
            password: hashPassword,
            roles: role
        })

        await userRepository.save(newUser)

        const { password: _, ...user } = newUser

        return res.status(201).json({ user })
    }

    async login(req: CustomRequest<BodyUserLoginTypes>, res: Response) {
        const { email, password } = req.body

        const user = await userRepository.findOneBy({ email })

        if (!user) {
            throw new BadRequestError('E-mail não cadastrado')
        }

        const verifyPass = await bcrypt.compare(password, user.password)

        if (!verifyPass) {
            throw new BadRequestError('Senha inválida')
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_PASS ?? '', {
            subject: user.id,
            expiresIn: '8h'
        })

        const { password: _, ...userLogin } = user

        return res.json({
            user: userLogin,
            token
        })
    }

    async updateRoles(req: CustomRequest<BodyUserUpdateTypes>, res: Response) {
        const { user_id, roles, congregation_id } = req.body

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

    async recoverUserInformation(req: CustomRequest<BodyRecoverUserInformationTypes>, res: Response) {
        const { token } = req.body

        const jwtPass = process.env.JWT_PASS ?? ""

        let userId

        jwt.verify(token, jwtPass, (err, decoded) => {
            if (err) {
                throw new UnauthorizedError('Token invalid')
            }

            userId = decoded?.sub?.toString()
        })

        const user = await userRepository.findOneBy({ id: userId })

        if(!user){
            throw new BadRequestError('User not found')
        }

        const { password: _, ...userLogin } = user


        return res.status(200).json(userLogin)
    }
}

export default new UserController()