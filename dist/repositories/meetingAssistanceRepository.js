"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetingAssistanceRepository = void 0;
const data_source_1 = require("../data-source");
const MeetingAssistance_1 = require("../entities/MeetingAssistance");
exports.meetingAssistanceRepository = data_source_1.AppDataSource.getRepository(MeetingAssistance_1.MeetingAssistance);
