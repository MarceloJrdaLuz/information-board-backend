"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldServiceScheduleRepository = void 0;
const data_source_1 = require("../data-source");
const FieldServiceSchedule_1 = require("../entities/FieldServiceSchedule");
exports.fieldServiceScheduleRepository = data_source_1.AppDataSource.getRepository(FieldServiceSchedule_1.FieldServiceSchedule);
