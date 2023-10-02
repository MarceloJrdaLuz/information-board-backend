"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherRepository = void 0;
const data_source_1 = require("../data-source");
const Publisher_1 = require("../entities/Publisher");
exports.publisherRepository = data_source_1.AppDataSource.getRepository(Publisher_1.Publisher);
