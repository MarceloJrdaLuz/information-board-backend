"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldServiceTemplateLocationOverrideRepository = void 0;
const data_source_1 = require("../data-source");
const FieldServiceTemplateLocationOverride_1 = require("../entities/FieldServiceTemplateLocationOverride");
exports.fieldServiceTemplateLocationOverrideRepository = data_source_1.AppDataSource.getRepository(FieldServiceTemplateLocationOverride_1.FieldServiceTemplateLocationOverride);
