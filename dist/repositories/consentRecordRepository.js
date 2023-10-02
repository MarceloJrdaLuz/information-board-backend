"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consentRecordRepository = void 0;
const data_source_1 = require("../data-source");
const ConsentRecord_1 = require("../entities/ConsentRecord");
exports.consentRecordRepository = data_source_1.AppDataSource.getRepository(ConsentRecord_1.ConsentRecord);
