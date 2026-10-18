"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleaningGroupUnavailabilityRepository = void 0;
const data_source_1 = require("../data-source");
const CleaningGroupUnavailability_1 = require("../entities/CleaningGroupUnavailability");
exports.cleaningGroupUnavailabilityRepository = data_source_1.AppDataSource.getRepository(CleaningGroupUnavailability_1.CleaningGroupUnavailability);
