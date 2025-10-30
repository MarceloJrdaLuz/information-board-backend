"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agreementRepository = void 0;
const data_source_1 = require("../data-source");
const DataProcessingAgreement_1 = require("../entities/DataProcessingAgreement");
exports.agreementRepository = data_source_1.AppDataSource.getRepository(DataProcessingAgreement_1.DataProcessingAgreement);
