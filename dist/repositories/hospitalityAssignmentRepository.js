"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hospitalityAssignmentRepository = void 0;
const data_source_1 = require("../data-source");
const HospitalityAssignment_1 = require("../entities/HospitalityAssignment");
exports.hospitalityAssignmentRepository = data_source_1.AppDataSource.getRepository(HospitalityAssignment_1.HospitalityAssignment);
