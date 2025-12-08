"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleaningScheduleConfigRepository = void 0;
const data_source_1 = require("../data-source");
const CleaningScheduleConfig_1 = require("../entities/CleaningScheduleConfig");
exports.cleaningScheduleConfigRepository = data_source_1.AppDataSource.getRepository(CleaningScheduleConfig_1.CleaningScheduleConfig);
