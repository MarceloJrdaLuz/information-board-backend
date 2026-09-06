"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWitnessTimeSlotPreferenceRepository = void 0;
const data_source_1 = require("../data-source");
const PublicWitnessTimeSlotPreference_1 = require("../entities/PublicWitnessTimeSlotPreference");
exports.publicWitnessTimeSlotPreferenceRepository = data_source_1.AppDataSource.getRepository(PublicWitnessTimeSlotPreference_1.PublicWitnessTimeSlotPreference);
