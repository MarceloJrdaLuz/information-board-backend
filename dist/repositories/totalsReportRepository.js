"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.totalsReportsRepository = void 0;
const data_source_1 = require("../data-source");
const TotalsReports_1 = require("../entities/TotalsReports");
exports.totalsReportsRepository = data_source_1.AppDataSource.getRepository(TotalsReports_1.TotalsReports);
