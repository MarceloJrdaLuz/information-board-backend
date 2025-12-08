"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.familyRepository = void 0;
const data_source_1 = require("../data-source");
const Family_1 = require("../entities/Family");
exports.familyRepository = data_source_1.AppDataSource.getRepository(Family_1.Family);
