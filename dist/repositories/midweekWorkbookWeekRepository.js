"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.midweekWorkbookWeekRepository = void 0;
const data_source_1 = require("../data-source");
const MidweekWorkbookWeek_1 = require("../entities/MidweekWorkbookWeek");
exports.midweekWorkbookWeekRepository = data_source_1.AppDataSource.getRepository(MidweekWorkbookWeek_1.MidweekWorkbookWeek);
