"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hospitalityWeekendRepository = void 0;
const data_source_1 = require("../data-source");
const HospitalityWeekend_1 = require("../entities/HospitalityWeekend");
exports.hospitalityWeekendRepository = data_source_1.AppDataSource.getRepository(HospitalityWeekend_1.HospitalityWeekend);
