import { Request, Response } from "express";
import { In } from "typeorm";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { permissionRepository } from "../../repositories/permissionRepository";
import { roleRepository } from "../../repositories/roleRepository";
import { BodyRoleCreateTypes, ParamsUpdateRoleTypes } from "./types";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { messageErrors } from "../../helpers/messageErrors";

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
        }else{
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
        const roles = await roleRepository.find({ relations: ['permissions'] })

        if (!roles) {
            throw new NotFoundError('Roles not found')
        }

        return res.status(200).json(roles)
    }
}

export default new RoleController()