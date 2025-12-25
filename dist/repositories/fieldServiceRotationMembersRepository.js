"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldServiceRotationMemberRepository = void 0;
const data_source_1 = require("../data-source");
const FieldServiceRotationMember_1 = require("../entities/FieldServiceRotationMember");
exports.fieldServiceRotationMemberRepository = data_source_1.AppDataSource.getRepository(FieldServiceRotationMember_1.FieldServiceRotationMember);
