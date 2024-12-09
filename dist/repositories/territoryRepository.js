"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.territoryRepository = void 0;
const data_source_1 = require("../data-source");
const Territory_1 = require("../entities/Territory");
exports.territoryRepository = data_source_1.AppDataSource.getRepository(Territory_1.Territory);
