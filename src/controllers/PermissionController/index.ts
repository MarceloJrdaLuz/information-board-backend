import { Response } from "express";
import { In } from "typeorm";
import { BadRequestError } from "../../helpers/api-errors";
import { permissionRepository } from "../../repositories/permissionRepository";
import { BodyPermissionCreateTypes, CustomRequest } from "./type";

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
}

export default new PermissionController()