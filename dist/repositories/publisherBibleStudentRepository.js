"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherBibleStudentRepository = void 0;
const data_source_1 = require("../data-source");
const PublisherBibleStudent_1 = require("../entities/PublisherBibleStudent");
exports.publisherBibleStudentRepository = data_source_1.AppDataSource.getRepository(PublisherBibleStudent_1.PublisherBibleStudent);
