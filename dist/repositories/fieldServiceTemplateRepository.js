"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldServiceTemplateRepository = void 0;
const data_source_1 = require("../data-source");
const FieldServiceTemplate_1 = require("../entities/FieldServiceTemplate");
exports.fieldServiceTemplateRepository = data_source_1.AppDataSource.getRepository(FieldServiceTemplate_1.FieldServiceTemplate);
