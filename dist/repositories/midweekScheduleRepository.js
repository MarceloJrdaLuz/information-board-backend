"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.midweekScheduleRepository = void 0;
const data_source_1 = require("../data-source");
const MidweekSchedule_1 = require("../entities/MidweekSchedule");
exports.midweekScheduleRepository = data_source_1.AppDataSource.getRepository(MidweekSchedule_1.MidweekSchedule);
