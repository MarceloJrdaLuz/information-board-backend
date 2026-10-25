"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWitnessArrangementPublisherRepository = void 0;
const data_source_1 = require("../data-source");
const PublicWitnessArrangementPublisher_1 = require("../entities/PublicWitnessArrangementPublisher");
exports.publicWitnessArrangementPublisherRepository = data_source_1.AppDataSource.getRepository(PublicWitnessArrangementPublisher_1.PublicWitnessArrangementPublisher);
