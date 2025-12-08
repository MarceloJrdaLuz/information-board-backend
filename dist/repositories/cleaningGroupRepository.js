"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleaningGroupRepository = void 0;
const data_source_1 = require("../data-source");
const CleaningGroup_1 = require("../entities/CleaningGroup");
exports.cleaningGroupRepository = data_source_1.AppDataSource.getRepository(CleaningGroup_1.CleaningGroup);
