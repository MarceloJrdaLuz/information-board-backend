"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.congregationRepository = void 0;
const data_source_1 = require("../data-source");
const Congregation_1 = require("../entities/Congregation");
exports.congregationRepository = data_source_1.AppDataSource.getRepository(Congregation_1.Congregation);
