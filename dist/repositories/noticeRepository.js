"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noticeRepository = void 0;
const data_source_1 = require("../data-source");
const Notice_1 = require("../entities/Notice");
exports.noticeRepository = data_source_1.AppDataSource.getRepository(Notice_1.Notice);
