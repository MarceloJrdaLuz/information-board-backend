"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyContactRepository = void 0;
const data_source_1 = require("../data-source");
const EmergencyContact_1 = require("../entities/EmergencyContact");
exports.emergencyContactRepository = data_source_1.AppDataSource.getRepository(EmergencyContact_1.EmergencyContact);
