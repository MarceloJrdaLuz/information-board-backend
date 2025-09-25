"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speakerRepository = void 0;
const data_source_1 = require("../data-source");
const Speaker_1 = require("../entities/Speaker");
exports.speakerRepository = data_source_1.AppDataSource.getRepository(Speaker_1.Speaker);
