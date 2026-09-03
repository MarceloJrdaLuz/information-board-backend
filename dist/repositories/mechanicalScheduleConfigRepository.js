"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mechanicalScheduleConfigRepository = void 0;
const data_source_1 = require("../data-source");
const MechanicalScheduleConfig_1 = require("../entities/MechanicalScheduleConfig");
exports.mechanicalScheduleConfigRepository = data_source_1.AppDataSource.getRepository(MechanicalScheduleConfig_1.MechanicalScheduleConfig);
