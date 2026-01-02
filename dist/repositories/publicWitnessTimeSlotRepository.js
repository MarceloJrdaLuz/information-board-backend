"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWitnessTimeSlotRepository = void 0;
const data_source_1 = require("../data-source");
const PublicWitnessTimeSlot_1 = require("../entities/PublicWitnessTimeSlot");
exports.publicWitnessTimeSlotRepository = data_source_1.AppDataSource.getRepository(PublicWitnessTimeSlot_1.PublicWitnessTimeSlot);
