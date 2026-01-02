"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWitnessTimeSlotDefaultPublisherRepository = void 0;
const data_source_1 = require("../data-source");
const PublicWitnessTimeSlotDefaultPublisher_1 = require("../entities/PublicWitnessTimeSlotDefaultPublisher");
exports.publicWitnessTimeSlotDefaultPublisherRepository = data_source_1.AppDataSource.getRepository(PublicWitnessTimeSlotDefaultPublisher_1.PublicWitnessTimeSlotDefaultPublisher);
