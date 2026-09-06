"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.midweekMeetingPartRepository = void 0;
const data_source_1 = require("../data-source");
const MidweekMeetingPart_1 = require("../entities/MidweekMeetingPart");
exports.midweekMeetingPartRepository = data_source_1.AppDataSource.getRepository(MidweekMeetingPart_1.MidweekMeetingPart);
