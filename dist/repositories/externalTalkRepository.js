"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalTalkRepository = void 0;
const data_source_1 = require("../data-source");
const ExternalTalk_1 = require("../entities/ExternalTalk");
exports.externalTalkRepository = data_source_1.AppDataSource.getRepository(ExternalTalk_1.ExternalTalk);
