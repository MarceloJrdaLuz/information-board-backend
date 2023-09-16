import { Request, Response } from "express";
import { In } from "typeorm";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { permissionRepository } from "../../repositories/permissionRepository";
import { roleRepository } from "../../repositories/roleRepository";
import { BodyRoleCreateTypes } from "./types";
import { CustomRequest } from "../../types/customRequest";

class RoleController {
    async create(req: CustomRequest<BodyRoleCreateTypes>, res: Response) {
        const { name, description, permissions } = req.body

        const role = await roleRepository.findOneBy({name})

        if(role){
            throw new BadRequestError('Role already exists')
        }

        const permissionsExists = await permissionRepository.findBy({id: In([...permissions])})

        const newRole = roleRepository.create({
            name, 
            description,
            permissions: permissionsExists
        })

        await roleRepository.save(newRole)

        return res.status(201).json(newRole)
    }

    async getRoles(req: Request, res: Response){
        const roles = await roleRepository.find({})

        if(!roles){
            throw new NotFoundError('Roles not found')
        }

        return res.status(200).json(roles)
    }
}

export default new RoleController()