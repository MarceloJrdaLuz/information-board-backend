"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privilegeRepository = void 0;
const data_source_1 = require("../data-source");
const Privilege_1 = require("../entities/Privilege");
exports.privilegeRepository = data_source_1.AppDataSource.getRepository(Privilege_1.Privilege);
