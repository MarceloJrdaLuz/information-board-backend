"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.termsRepository = void 0;
const data_source_1 = require("../data-source");
const TermsOfUse_1 = require("../entities/TermsOfUse");
exports.termsRepository = data_source_1.AppDataSource.getRepository(TermsOfUse_1.TermsOfUse);
