"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.specialEventRepository = void 0;
const data_source_1 = require("../data-source");
const SpecialEvent_1 = require("../entities/SpecialEvent");
exports.specialEventRepository = data_source_1.AppDataSource.getRepository(SpecialEvent_1.SpecialEvent);
