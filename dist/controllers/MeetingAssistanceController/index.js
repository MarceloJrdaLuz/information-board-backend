"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const congregationRepository_1 = require("../../repositories/congregationRepository");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const enumWeekDays_1 = require("../../types/enumWeekDays");
const meetingAssistanceRepository_1 = require("../../repositories/meetingAssistanceRepository");
class TotalsReportsController {
    async create(req, res) {
        const { congregation_id } = req.params;
        const { endWeek, midWeek, endWeekAverage, endWeekTotal, midWeekAverage, midWeekTotal, month, year } = req.body;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        if (!Object.values(enumWeekDays_1.Months).some(enumMonth => enumMonth === month)) {
            return res.status(400).json({ message: 'Invalid month value' });
        }
        let existsMeetingAssistance = await meetingAssistanceRepository_1.meetingAssistanceRepository.findOne({
            where: {
                month: month,
                year,
                congregation: {
                    id: congregation.id
                }
            }
        });
        if (existsMeetingAssistance) {
            existsMeetingAssistance.endWeek = endWeek;
            existsMeetingAssistance.endWeekTotal = endWeekTotal;
            existsMeetingAssistance.endWeekAverage = endWeekAverage;
            existsMeetingAssistance.midWeek = midWeek;
            existsMeetingAssistance.midWeekTotal = midWeekTotal;
            existsMeetingAssistance.midWeekAverage = midWeekAverage;
            await meetingAssistanceRepository_1.meetingAssistanceRepository.save(existsMeetingAssistance).catch(err => console.log(err));
            res.send(existsMeetingAssistance);
        }
        else {
            const newMeetingAssistance = meetingAssistanceRepository_1.meetingAssistanceRepository.create({
                congregation,
                month: month,
                year,
                endWeek,
                midWeek,
                endWeekAverage,
                endWeekTotal,
                midWeekAverage,
                midWeekTotal,
            });
            await meetingAssistanceRepository_1.meetingAssistanceRepository.save(newMeetingAssistance).catch(err => console.log(err));
            res.send(newMeetingAssistance);
        }
    }
    async getAssistance(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const meetingAssistance = await meetingAssistanceRepository_1.meetingAssistanceRepository.find({
            where: {
                congregation: {
                    id: congregation.id
                }
            }
        });
        res.send(meetingAssistance);
    }
}
exports.default = new TotalsReportsController();
