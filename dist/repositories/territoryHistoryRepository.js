"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.territoryHistoryRepository = void 0;
const data_source_1 = require("../data-source");
const TerritoryHistory_1 = require("../entities/TerritoryHistory");
exports.territoryHistoryRepository = data_source_1.AppDataSource.getRepository(TerritoryHistory_1.TerritoryHistory);
