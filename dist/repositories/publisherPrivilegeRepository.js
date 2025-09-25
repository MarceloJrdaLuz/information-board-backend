"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherPrivilegeRepository = void 0;
const data_source_1 = require("../data-source");
const PublisherPrivilege_1 = require("../entities/PublisherPrivilege");
exports.publisherPrivilegeRepository = data_source_1.AppDataSource.getRepository(PublisherPrivilege_1.PublisherPrivilege);
