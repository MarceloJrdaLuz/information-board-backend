"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWitnessArrangementRepository = void 0;
const data_source_1 = require("../data-source");
const PublicWitnessArrangement_1 = require("../entities/PublicWitnessArrangement");
exports.publicWitnessArrangementRepository = data_source_1.AppDataSource.getRepository(PublicWitnessArrangement_1.PublicWitnessArrangement);
