"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.midweekWorkbookPartRepository = void 0;
const data_source_1 = require("../data-source");
const MidweekWorkbookPart_1 = require("../entities/MidweekWorkbookPart");
exports.midweekWorkbookPartRepository = data_source_1.AppDataSource.getRepository(MidweekWorkbookPart_1.MidweekWorkbookPart);
