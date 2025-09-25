"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hospitalityGroupRepository = void 0;
const data_source_1 = require("../data-source");
const HospitalityGroup_1 = require("../entities/HospitalityGroup.");
exports.hospitalityGroupRepository = data_source_1.AppDataSource.getRepository(HospitalityGroup_1.HospitalityGroup);
