"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mechanicalScheduleRepository = void 0;
const data_source_1 = require("../data-source");
const MechanicalSchedule_1 = require("../entities/MechanicalSchedule");
exports.mechanicalScheduleRepository = data_source_1.AppDataSource.getRepository(MechanicalSchedule_1.MechanicalSchedule);
