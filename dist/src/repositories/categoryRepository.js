"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = void 0;
const data_source_1 = require("../data-source");
const Category_1 = require("../entities/Category");
exports.categoryRepository = data_source_1.AppDataSource.getRepository(Category_1.Category);
