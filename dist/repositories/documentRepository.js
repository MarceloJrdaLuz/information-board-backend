"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRepository = void 0;
const data_source_1 = require("../data-source");
const Document_1 = require("../entities/Document");
exports.documentRepository = data_source_1.AppDataSource.getRepository(Document_1.Document);
