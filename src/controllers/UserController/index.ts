import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { userRepository } from "../../repositories/userRepository";
import { BodyUserCreateTypes, BodyUserLoginTypes, CustomRequest } from "./type";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { profileRepository } from "../../repositories/profileRepository";

class UserController {
    async create(req: CustomRequest<BodyUserCreateTypes>, res: Response) {
        const { email, password } = req.body

        const userExists = await userRepository.findOneBy({ email })

        if(userExists){
            throw new BadRequestError('E-mail já cadastrado')
        }
    
        const hashPassword = await bcrypt.hash(password, 10)

        const newUser = userRepository.create({
            email,
            password: hashPassword
        })

        await userRepository.save(newUser)

        const { password: _ , ...user} = newUser

        return res.status(201).json({user})
    }

    async login(req: CustomRequest<BodyUserLoginTypes>, res: Response) {
        const { email, password} = req.body

        const user = await userRepository.findOneBy({ email })

        if(!user){
            throw new BadRequestError('E-mail não cadastrado')
        }

        const verifyPass = await bcrypt.compare(password, user.password)

        if(!verifyPass){
            throw new BadRequestError('Senha inválida')
        }

        const token = jwt.sign({id: user.id}, process.env.JWT_PASS ?? '', {
            expiresIn: '2h'
        })

        const { password:_, ...userLogin} = user

        return res.json({
            user: userLogin,
            token
        })  
    }

}

export default new UserController()