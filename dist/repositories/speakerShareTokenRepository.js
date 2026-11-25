"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speakerShareTokenRepository = void 0;
const data_source_1 = require("../data-source");
const SpeakerShareToken_1 = require("../entities/SpeakerShareToken");
exports.speakerShareTokenRepository = data_source_1.AppDataSource.getRepository(SpeakerShareToken_1.SpeakerShareToken);
