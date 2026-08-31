"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherMidweekQualificationRepository = void 0;
const data_source_1 = require("../data-source");
const PublisherMidweekQualification_1 = require("../entities/PublisherMidweekQualification");
exports.publisherMidweekQualificationRepository = data_source_1.AppDataSource.getRepository(PublisherMidweekQualification_1.PublisherMidweekQualification);
