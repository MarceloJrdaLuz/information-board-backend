import { NextFunction, Request, Response } from "express";
import { decode } from "jsonwebtoken";
import { UnauthorizedError } from "../helpers/api-errors";
import { userRepository } from "../repositories/userRepository";
import jwt from "jsonwebtoken";
import process from "process";

export async function decoder(request: Request) {
    const authHeader = request.headers.authorization

    if (!authHeader) {
        throw new UnauthorizedError('No token provided')
    }

    const parts = authHeader.split(' ')

    if (parts.length !== 2) {
        throw new UnauthorizedError('Token Error')
    }

    const [scheme, token] = parts

    if (!/^Bearer$/i.test(scheme)) {
        throw new UnauthorizedError('Token malformatted')
    }

    const jwtPass = process.env.JWT_PASS ?? ""

    jwt.verify(token, jwtPass, (err, decoded) => {
        if (err) {
            throw new UnauthorizedError('Token invalid')
        }
    })

    const payload = decode(token)

    const user = await userRepository.findOneBy({ id: payload?.sub?.toString() })

    return {
        id: user?.id,
        roles: user?.roles
    }

}

export function is(role: string[]) {
    const roleAuthorized = async (req: Request, res: Response, next: NextFunction) => {
        const user = await decoder(req)

        const { congregation_id } = req.body

        const userRoles = user?.roles?.map(role => role.name)

        const rolesExists = userRoles?.some(r => role.includes(r))

        if (rolesExists) {
            if(userRoles?.includes("ADMIN_CONGREGATION")){
                const userCongregation = await userRepository.find({
                    where: {
                        congregation: {
                            id: congregation_id
                        },
                    }
                })

                if(userCongregation.length < 1){
                    throw new UnauthorizedError('User is not admin in this congregation')
                }
                return next()
            }
            return next()
        }
        throw new UnauthorizedError('Unauthorized')
    }
    return roleAuthorized
}
