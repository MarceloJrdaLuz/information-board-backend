import { Response } from "express";
import { In } from "typeorm";
import { BadRequestError } from "../../helpers/api-errors";
import { permissionRepository } from "../../repositories/permissionRepository";
import { roleRepository } from "../../repositories/roleRepository";
import { BodyRoleCreateTypes, CustomRequest } from "./type";

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
}

export default new RoleController()