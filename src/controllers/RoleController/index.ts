import { Request, Response } from "express";
import { In } from "typeorm";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { permissionRepository } from "../../repositories/permissionRepository";
import { roleRepository } from "../../repositories/roleRepository";
import { BodyRoleCreateTypes, ParamsUpdateRoleTypes } from "./types";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { messageErrors } from "../../helpers/messageErrors";
import { decoder } from "../../middlewares/permissions";
import { Role } from "../../entities/Role";

class RoleController {
    async create(req: CustomRequest<BodyRoleCreateTypes>, res: Response) {
        const { name, description, permissions } = req.body

        const role = await roleRepository.findOneBy({ name })

        if (role) {
            throw new BadRequestError('Role already exists')
        }

        const permissionsExists = await permissionRepository.findBy({ id: In([...permissions]) })

        const newRole = roleRepository.create({
            name,
            description,
            permissions: permissionsExists
        })

        await roleRepository.save(newRole)

        return res.status(201).json(newRole)
    }

    async update(req: CustomRequestPT<ParamsUpdateRoleTypes, BodyRoleCreateTypes>, res: Response) {
        const { role_id } = req.params
        const { name, description, permissions } = req.body

        const role = await roleRepository.findOneBy({ id: role_id })

        if (!role) throw new NotFoundError(messageErrors.notFound.role)

        role.name = name !== undefined ? name : role.name
        role.description = description !== undefined ? description : role.description

        if (permissions) {
            const permissionsExists = await permissionRepository.findBy({ id: In([...permissions]) })

            if (permissionsExists) {
                role.permissions = permissionsExists
            }
        } else {
            role.permissions = []
        }

        await roleRepository.save(role)

        return res.status(201).json(role)
    }

    async getRole(req: ParamsCustomRequest<ParamsUpdateRoleTypes>, res: Response) {
        const { role_id } = req.params

        const role = await roleRepository.findOne({
            where: {
                id: role_id
            },
            relations: ['permissions']
        })

        if (!role) throw new NotFoundError(messageErrors.notFound.role)


        return res.status(200).json(role)
    }

    async getRoles(req: Request, res: Response) {
        const requestByUserId = await decoder(req)

        const rolesResponse: Role[] = []

        const roles = await roleRepository.find({ relations: ['permissions'] })

        if (!roles) {
            throw new NotFoundError(messageErrors.notFound.role)
        }

        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name !== 'ADMIN') {

            const removeAdmin = roles.filter(role => role.name !== 'ADMIN')

            rolesResponse.push(...removeAdmin)
        } else {
            rolesResponse.push(...roles)
        }

        return res.status(200).json(rolesResponse)
    }

    async delete(req: ParamsCustomRequest<ParamsUpdateRoleTypes>, res: Response) {
        const { role_id } = req.params

        const role = await roleRepository.findOneBy({ id: role_id })

        if (!role) {
            throw new NotFoundError(messageErrors.notFound.role)
        }
        
        await roleRepository.remove(role)

        return res.status(200).end()
    }
}

export default new RoleController()