"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleReminderConfigRepository = void 0;
const data_source_1 = require("../data-source");
const ScheduleReminderConfig_1 = require("../entities/ScheduleReminderConfig");
exports.scheduleReminderConfigRepository = data_source_1.AppDataSource.getRepository(ScheduleReminderConfig_1.ScheduleReminderConfig);
