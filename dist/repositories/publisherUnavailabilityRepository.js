"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherUnavailabilityRepository = void 0;
const data_source_1 = require("../data-source");
const PublisherUnavailability_1 = require("../entities/PublisherUnavailability");
exports.publisherUnavailabilityRepository = data_source_1.AppDataSource.getRepository(PublisherUnavailability_1.PublisherUnavailability);
