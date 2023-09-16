import { Response } from "express";
import { Request } from "express-serve-static-core";
import { In } from "typeorm";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { permissionRepository } from "../../repositories/permissionRepository";
import { BodyPermissionCreateTypes } from "./type";
import { CustomRequest } from "../../types/customRequest";

class PermissionController {
    async create(req: CustomRequest<BodyPermissionCreateTypes>, res: Response) {
        const { name, description } = req.body

        const permission = await permissionRepository.findOneBy({name})

        if(permission){
            throw new BadRequestError('Permission already exists')
        }


        const newPermission = permissionRepository.create({
            name, 
            description,
        })

        await permissionRepository.save(newPermission)

        return res.status(201).json(newPermission)
    }

    async getPermissions(req: Request, res: Response){
        const permissions = await permissionRepository.find({})

        if(!permissions){
            throw new NotFoundError('Permissions not found')
        }

        return res.status(200).json(permissions)
    }
}

export default new PermissionController()