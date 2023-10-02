"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupRepository = void 0;
const data_source_1 = require("../data-source");
const Group_1 = require("../entities/Group");
exports.groupRepository = data_source_1.AppDataSource.getRepository(Group_1.Group);
