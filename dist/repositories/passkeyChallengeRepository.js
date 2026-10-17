"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passkeyChallengeRepository = void 0;
const data_source_1 = require("../data-source");
const PasskeyChallenge_1 = require("../entities/PasskeyChallenge");
exports.passkeyChallengeRepository = data_source_1.AppDataSource.getRepository(PasskeyChallenge_1.PasskeyChallenge);
