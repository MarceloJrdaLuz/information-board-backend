import { NextFunction, Request, Response } from "express";
import { decode } from "jsonwebtoken";
import { UnauthorizedError } from "../helpers/api-errors";
import { userRepository } from "../repositories/userRepository";
import jwt from "jsonwebtoken";
import process from "process";
import { config } from "../config";

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

    const user = await userRepository.findOne({
        where: { id: payload?.sub?.toString() },
        relations: ['publisher']
    })

    if (!user) {
        throw new UnauthorizedError("User not found")
    }

    return {
        id: user.id,
        roles: user.roles,
        publisher_id: user.publisher?.id ?? null
    }

}

export function verifyCronSecret(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (authHeader !== `Bearer ${config.cron_secret}`) {
        throw new UnauthorizedError('Cron secret invalid')
    }
    return next()
}

export function requirePublisher() {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = await decoder(req)

        if (!user.publisher_id) {
            throw new UnauthorizedError(
                "User is not linked to a publisher"
            )
        }

        return next()
    }
}

export function is(role: string[]) {
    const roleAuthorized = async (req: Request, res: Response, next: NextFunction) => {
        const user = await decoder(req)

        // pega do body ou dos params
        const congregation_id = req.body.congregation_id || req.params.id

        const userRoles = user?.roles?.map(role => role.name)
        const rolesExists = userRoles?.some(r => role.includes(r))

        if (rolesExists) {
            if (userRoles?.includes("ADMIN")) {
                return next()
            } else {
                // se for admin_congregation, precisa pertencer à congregação
                const userCongregation = await userRepository.find({
                    where: {
                        id: user.id,
                        congregation: { id: congregation_id }
                    }
                })

                if (userCongregation.length < 1) {
                    throw new UnauthorizedError('User is not admin in this congregation')
                }
                return next()
            }
        }
        throw new UnauthorizedError('Unauthorized')
    }
    return roleAuthorized
}
