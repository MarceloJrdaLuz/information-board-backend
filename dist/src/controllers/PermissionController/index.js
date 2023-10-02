"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const permissionRepository_1 = require("../../repositories/permissionRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
class PermissionController {
    async create(req, res) {
        const { name, description } = req.body;
        const permission = await permissionRepository_1.permissionRepository.findOneBy({ name });
        if (permission) {
            throw new api_errors_1.BadRequestError('Permission already exists');
        }
        const newPermission = permissionRepository_1.permissionRepository.create({
            name,
            description,
        });
        await permissionRepository_1.permissionRepository.save(newPermission);
        return res.status(201).json(newPermission);
    }
    async getPermission(req, res) {
        const { permission_id } = req.params;
        const permission = await permissionRepository_1.permissionRepository.findOneBy({ id: permission_id });
        if (!permission)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.permission);
        return res.status(200).json(permission);
    }
    async update(req, res) {
        const { permission_id } = req.params;
        const { name, description } = req.body;
        const permission = await permissionRepository_1.permissionRepository.findOneBy({ id: permission_id });
        if (!permission)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.permission);
        permission.name = name !== undefined ? name : permission.name;
        permission.description = description !== undefined ? description : permission.description;
        await permissionRepository_1.permissionRepository.save(permission);
        return res.status(201).json(permission);
    }
    async getPermissions(req, res) {
        const permissions = await permissionRepository_1.permissionRepository.find({});
        if (!permissions) {
            throw new api_errors_1.NotFoundError('Permissions not found');
        }
        return res.status(200).json(permissions);
    }
    async delete(req, res) {
        const { permission_id } = req.params;
        const permission = await permissionRepository_1.permissionRepository.findOneBy({ id: permission_id });
        if (!permission) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.permission);
        }
        await permissionRepository_1.permissionRepository.remove(permission);
        return res.status(200).end();
    }
}
exports.default = new PermissionController();
