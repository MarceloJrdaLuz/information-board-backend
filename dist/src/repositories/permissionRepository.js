"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionRepository = void 0;
const data_source_1 = require("../data-source");
const Permission_1 = require("../entities/Permission");
exports.permissionRepository = data_source_1.AppDataSource.getRepository(Permission_1.Permission);
