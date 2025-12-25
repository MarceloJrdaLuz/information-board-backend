"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldServiceExceptionRepository = void 0;
const data_source_1 = require("../data-source");
const FieldServiceException_1 = require("../entities/FieldServiceException");
exports.fieldServiceExceptionRepository = data_source_1.AppDataSource.getRepository(FieldServiceException_1.FieldServiceException);
