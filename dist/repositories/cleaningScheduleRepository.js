"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleaningScheduleRepository = void 0;
const data_source_1 = require("../data-source");
const CleaningSchedule_1 = require("../entities/CleaningSchedule");
exports.cleaningScheduleRepository = data_source_1.AppDataSource.getRepository(CleaningSchedule_1.CleaningSchedule);
