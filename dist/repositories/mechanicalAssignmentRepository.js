"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mechanicalAssignmentRepository = void 0;
const data_source_1 = require("../data-source");
const MechanicalAssignment_1 = require("../entities/MechanicalAssignment");
exports.mechanicalAssignmentRepository = data_source_1.AppDataSource.getRepository(MechanicalAssignment_1.MechanicalAssignment);
