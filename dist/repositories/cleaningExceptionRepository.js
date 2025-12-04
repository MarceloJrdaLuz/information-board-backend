"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleaningExceptionRepository = void 0;
const data_source_1 = require("../data-source");
const CleaningException_1 = require("../entities/CleaningException");
exports.cleaningExceptionRepository = data_source_1.AppDataSource.getRepository(CleaningException_1.CleaningException);
