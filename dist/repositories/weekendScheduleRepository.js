"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weekendScheduleRepository = void 0;
const data_source_1 = require("../data-source");
const WeekendSchedule_1 = require("../entities/WeekendSchedule");
exports.weekendScheduleRepository = data_source_1.AppDataSource.getRepository(WeekendSchedule_1.WeekendSchedule);
