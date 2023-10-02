"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
const permissionRepository_1 = require("../../repositories/permissionRepository");
const roleRepository_1 = require("../../repositories/roleRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
const permissions_1 = require("../../middlewares/permissions");
class RoleController {
    async create(req, res) {
        const { name, description, permissions } = req.body;
        const role = await roleRepository_1.roleRepository.findOneBy({ name });
        if (role) {
            throw new api_errors_1.BadRequestError('Role already exists');
        }
        const permissionsExists = await permissionRepository_1.permissionRepository.findBy({ id: (0, typeorm_1.In)([...permissions]) });
        const newRole = roleRepository_1.roleRepository.create({
            name,
            description,
            permissions: permissionsExists
        });
        await roleRepository_1.roleRepository.save(newRole);
        return res.status(201).json(newRole);
    }
    async update(req, res) {
        const { role_id } = req.params;
        const { name, description, permissions } = req.body;
        const role = await roleRepository_1.roleRepository.findOneBy({ id: role_id });
        if (!role)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.role);
        role.name = name !== undefined ? name : role.name;
        role.description = description !== undefined ? description : role.description;
        if (permissions) {
            const permissionsExists = await permissionRepository_1.permissionRepository.findBy({ id: (0, typeorm_1.In)([...permissions]) });
            if (permissionsExists) {
                role.permissions = permissionsExists;
            }
        }
        else {
            role.permissions = [];
        }
        await roleRepository_1.roleRepository.save(role);
        return res.status(201).json(role);
    }
    async getRole(req, res) {
        const { role_id } = req.params;
        const role = await roleRepository_1.roleRepository.findOne({
            where: {
                id: role_id
            },
            relations: ['permissions']
        });
        if (!role)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.role);
        return res.status(200).json(role);
    }
    async getRoles(req, res) {
        const requestByUserId = await (0, permissions_1.decoder)(req);
        const rolesResponse = [];
        const roles = await roleRepository_1.roleRepository.find({ relations: ['permissions'] });
        if (!roles) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.role);
        }
        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name !== 'ADMIN') {
            const removeAdmin = roles.filter(role => role.name !== 'ADMIN');
            rolesResponse.push(...removeAdmin);
        }
        else {
            rolesResponse.push(...roles);
        }
        return res.status(200).json(rolesResponse);
    }
}
exports.default = new RoleController();
