"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupOverseersRepository = void 0;
const data_source_1 = require("../data-source");
const GroupOverseers_1 = require("../entities/GroupOverseers");
exports.groupOverseersRepository = data_source_1.AppDataSource.getRepository(GroupOverseers_1.GroupOverseers);
