"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWitnessAssignmentPublisherRepository = void 0;
const data_source_1 = require("../data-source");
const PublicWitnessAssignmentPublisher_1 = require("../entities/PublicWitnessAssignmentPublisher");
exports.publicWitnessAssignmentPublisherRepository = data_source_1.AppDataSource.getRepository(PublicWitnessAssignmentPublisher_1.PublicWitnessAssignmentPublisher);
