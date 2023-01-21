import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { userRepository } from "../../repositories/userRepository";
import { BodyUserCreateTypes, BodyUserLoginTypes, BodyUserUpdateTypes, CustomRequest } from "./type";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
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
            expiresIn: '2h'
        })

        const { password: _, ...userLogin } = user

        return res.json({
            user: userLogin,
            token
        })
    }

    async updateRoles(req: CustomRequest<BodyUserUpdateTypes>, res: Response) {
        const { user_id, roles } = req.body

        const user = await userRepository.findOneBy({id: user_id})
        const rolesExists = await roleRepository.findBy({id: In(roles)})

        if(!rolesExists){
            throw new NotFoundError('Any role not found')
        }

        const userUpdate = {
            ...user,
            roles: [...rolesExists]
        }   

        const updated = await userRepository.save(userUpdate)

        return res.status(201).json({updated})
    }

}

export default new UserController()