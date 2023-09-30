import { Response } from "express";
import { Request } from "express-serve-static-core";
import { In } from "typeorm";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { permissionRepository } from "../../repositories/permissionRepository";
import { BodyPermissionCreateTypes, ParamsUpdatePermissionTypes } from "./types";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { messageErrors } from "../../helpers/messageErrors";

class PermissionController {
    async create(req: CustomRequest<BodyPermissionCreateTypes>, res: Response) {
        const { name, description } = req.body

        const permission = await permissionRepository.findOneBy({ name })

        if (permission) {
            throw new BadRequestError('Permission already exists')
        }


        const newPermission = permissionRepository.create({
            name,
            description,
        })

        await permissionRepository.save(newPermission)

        return res.status(201).json(newPermission)
    }

    async getPermission(req: ParamsCustomRequest<ParamsUpdatePermissionTypes>, res: Response) {
        const { permission_id } = req.params
    
        const permission = await permissionRepository.findOneBy({ id: permission_id })
    
        if (!permission) throw new NotFoundError(messageErrors.notFound.permission)
    
        return res.status(200).json(permission)
      }

    async update(req: CustomRequestPT<ParamsUpdatePermissionTypes, BodyPermissionCreateTypes>, res: Response) {
        const { permission_id } = req.params
        const { name, description } = req.body

        const permission = await permissionRepository.findOneBy({ id: permission_id })

        if (!permission) throw new NotFoundError(messageErrors.notFound.permission)

        permission.name = name !== undefined ? name : permission.name
        permission.description = description !== undefined ? description : permission.description

        await permissionRepository.save(permission)

        return res.status(201).json(permission)
    }

    async getPermissions(req: Request, res: Response) {
        const permissions = await permissionRepository.find({})

        if (!permissions) {
            throw new NotFoundError('Permissions not found')
        }

        return res.status(200).json(permissions)
    }

    async delete(req: ParamsCustomRequest<ParamsUpdatePermissionTypes>, res: Response) {
        const { permission_id } = req.params

        const permission = await permissionRepository.findOneBy({ id: permission_id })

        if (!permission) {
            throw new NotFoundError(messageErrors.notFound.permission)
        }
        
        await permissionRepository.remove(permission)

        return res.status(200).end()
    }
}

export default new PermissionController()