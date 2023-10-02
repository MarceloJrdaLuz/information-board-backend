"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRepository = void 0;
const data_source_1 = require("../data-source");
const Role_1 = require("../entities/Role");
exports.roleRepository = data_source_1.AppDataSource.getRepository(Role_1.Role);
