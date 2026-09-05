"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessRequestRepository = void 0;
const data_source_1 = require("../data-source");
const AccessRequest_1 = require("../entities/AccessRequest");
exports.accessRequestRepository = data_source_1.AppDataSource.getRepository(AccessRequest_1.AccessRequest);
