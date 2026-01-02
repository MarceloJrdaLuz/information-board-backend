"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWitnessAssignmentRepository = void 0;
const data_source_1 = require("../data-source");
const PublicWitnessAssignment_1 = require("../entities/PublicWitnessAssignment");
exports.publicWitnessAssignmentRepository = data_source_1.AppDataSource.getRepository(PublicWitnessAssignment_1.PublicWitnessAssignment);
