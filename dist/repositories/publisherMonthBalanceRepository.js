"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherMonthBalanceRepository = void 0;
const data_source_1 = require("../data-source");
const PublisherMonthBalance_1 = require("../entities/PublisherMonthBalance");
exports.publisherMonthBalanceRepository = data_source_1.AppDataSource.getRepository(PublisherMonthBalance_1.PublisherMonthBalance);
