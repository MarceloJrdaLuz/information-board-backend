"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.talkRepository = void 0;
const data_source_1 = require("../data-source");
const Talk_1 = require("../entities/Talk");
exports.talkRepository = data_source_1.AppDataSource.getRepository(Talk_1.Talk);
