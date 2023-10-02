"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRepository = void 0;
const data_source_1 = require("../data-source");
const Report_1 = require("../entities/Report");
exports.reportRepository = data_source_1.AppDataSource.getRepository(Report_1.Report);
