"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const congregationRepository_1 = require("../../repositories/congregationRepository");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const totalsReportRepository_1 = require("../../repositories/totalsReportRepository");
const enumWeekDays_1 = require("../../types/enumWeekDays");
class TotalsReportsController {
    async create(req, res) {
        var _a, _b;
        const { congregation_id } = req.params;
        const { totals } = req.body;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        for (const total of totals) {
            if (!Object.values(enumWeekDays_1.Months).some(enumMonth => enumMonth === total.month)) {
                return res.status(400).json({ message: 'Invalid month value' });
            }
            const newTotalReports = totalsReportRepository_1.totalsReportsRepository.create({
                congregation,
                month: total.month,
                year: total.year,
                publishersActives: total.publishersActives,
                privileges: total.privileges,
                quantity: total.quantity,
                hours: (_a = total.hours) !== null && _a !== void 0 ? _a : 0,
                studies: (_b = total.studies) !== null && _b !== void 0 ? _b : 0,
            });
            await totalsReportRepository_1.totalsReportsRepository.save(newTotalReports).then(updatedReport => {
                return res.status(200).json(updatedReport);
            }).catch(err => {
                console.log(err);
            });
        }
        res.send();
    }
    async get(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        }
        const totals = await totalsReportRepository_1.totalsReportsRepository.find({
            where: {
                congregation: {
                    id: congregation.id
                }
            }
        });
        res.send(totals);
    }
}
exports.default = new TotalsReportsController();
