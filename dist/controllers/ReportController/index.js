"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const publisherRepository_1 = require("../../repositories/publisherRepository");
const api_errors_1 = require("../../helpers/api-errors");
const reportRepository_1 = require("../../repositories/reportRepository");
const enumWeekDays_1 = require("../../types/enumWeekDays");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const privileges_1 = require("../../types/privileges");
const userRepository_1 = require("../../repositories/userRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
const permissions_1 = require("../../middlewares/permissions");
class ReportController {
    async create(req, res) {
        const { month, year, publisher, hours, studies, observations } = req.body;
        if (!Object.values(enumWeekDays_1.Months).some(enumMonth => enumMonth === month)) {
            return res.status(400).json({ message: 'Invalid month value' });
        }
        const publisherExists = await publisherRepository_1.publisherRepository.findOne({
            where: {
                fullName: publisher.fullName,
                nickname: publisher.nickName,
                congregation: {
                    id: publisher.congregation_id
                }
            }
        });
        if (!publisherExists)
            throw new api_errors_1.NotFoundError('Publisher was not found');
        let existingReport = await reportRepository_1.reportRepository.findOne({
            where: {
                month: month,
                year,
                publisher: {
                    id: publisherExists.id // Assuming 'id' is the primary key property of the 'Publisher' entity
                }
            }
        });
        if (existingReport) {
            existingReport.hours = hours;
            existingReport.studies = studies;
            existingReport.observations = observations;
            await reportRepository_1.reportRepository.save(existingReport).then(updatedReport => {
                return res.status(200).json(updatedReport);
            }).catch(err => {
                console.log(err);
            });
        }
        else {
            const newReport = reportRepository_1.reportRepository.create({
                month: month,
                year,
                publisher: publisherExists,
                hours,
                studies,
                observations
            });
            await reportRepository_1.reportRepository.save(newReport).then(createdReport => {
                return res.status(201).json(createdReport);
            }).catch(err => {
                console.log(err);
            });
        }
    }
    async getReports(req, res) {
        const { congregationId } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregationId });
        if (!congregation)
            throw new api_errors_1.NotFoundError('Congregation was not found');
        const reports = await reportRepository_1.reportRepository.find({
            where: {
                publisher: {
                    congregation: {
                        id: congregationId,
                    },
                },
            },
            relations: ["publisher"],
        });
        if (reports.length === 0)
            throw new api_errors_1.NotFoundError('Any report in this congregation was found');
        const response = reports.map(report => ({
            id: report.id,
            month: report.month,
            year: report.year,
            hours: report.hours,
            studies: report.studies,
            observations: report.observations,
            publisher: {
                ...report.publisher
            },
            privileges: report.privileges
        }));
        res.json(response);
    }
    async getMyReports(req, res) {
        var _a;
        const userLogged = await (0, permissions_1.decoder)(req);
        const user = await userRepository_1.userRepository.findOne({ where: { id: userLogged.id }, relations: ["publisher"], select: ["publisher"] });
        if (!user)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.user);
        if (!user.publisher)
            throw new api_errors_1.BadRequestError("You are not linked to a publisher yet");
        const reports = await reportRepository_1.reportRepository.find({
            where: {
                publisher: {
                    id: (_a = user === null || user === void 0 ? void 0 : user.publisher) === null || _a === void 0 ? void 0 : _a.id
                },
            },
        });
        res.json(reports);
    }
    async getReportsByMonth(req, res) {
        const { congregationId } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregationId });
        if (!congregation)
            throw new api_errors_1.NotFoundError('Congregation was not found');
        const reports = await reportRepository_1.reportRepository.find({
            where: {
                publisher: {
                    congregation: {
                        id: congregationId,
                    },
                },
            },
            relations: ["publisher"],
        });
        if (reports.length === 0)
            throw new api_errors_1.NotFoundError('Any report in this congregation was found');
        const response = reports.map(report => ({
            id: report.id,
            month: report.month,
            year: report.year,
            hours: report.hours,
            studies: report.studies,
            observations: report.observations,
            publisher: {
                ...report.publisher
            },
            privileges: report.privileges
        }));
        res.json(response);
    }
    async updatePrivilege(req, res) {
        var _a;
        const { reports } = req.body;
        for (const report of reports) {
            // Encontre o relatório no banco de dados com base no report_id
            const existingReport = await reportRepository_1.reportRepository.findOneBy({ id: report.report_id });
            if (existingReport) {
                const privilegesExists = (_a = report.privileges) === null || _a === void 0 ? void 0 : _a.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
                if (!privilegesExists)
                    throw new api_errors_1.BadRequestError('Some privilege not exists');
                // Atualize o privilégio do relatório com os novos valores
                existingReport.privileges = report.privileges;
                // Salve a atualização no banco de dados
                await reportRepository_1.reportRepository.save(existingReport);
            }
        }
        res.send();
    }
    async deleteReport(req, res) {
        const { report_id: id } = req.params;
        const report = await reportRepository_1.reportRepository.findOne({
            where: {
                id
            },
        });
        if (!report)
            throw new api_errors_1.BadRequestError('Report not exists');
        await reportRepository_1.reportRepository.remove(report);
        return res.status(200).end();
    }
    async createReportManually(req, res) {
        var _a, _b;
        const { month, year, publisher, hours, studies, observations } = req.body;
        if (!Object.values(enumWeekDays_1.Months).some(enumMonth => enumMonth === month)) {
            return res.status(400).json({ message: 'Invalid month value' });
        }
        const publisherExists = await publisherRepository_1.publisherRepository.findOne({
            where: {
                fullName: publisher.fullName,
                nickname: publisher.nickName,
                congregation: {
                    id: publisher.congregation_id
                },
            }
        });
        if (!publisherExists)
            throw new api_errors_1.NotFoundError('Publisher was not found');
        let existingReport = await reportRepository_1.reportRepository.findOne({
            where: {
                month: month,
                year,
                publisher: {
                    id: publisherExists.id // Assuming 'id' is the primary key property of the 'Publisher' entity
                }
            }
        });
        if (existingReport) {
            const privilegesExists = (_a = publisher.privileges) === null || _a === void 0 ? void 0 : _a.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
            if (!privilegesExists)
                throw new api_errors_1.BadRequestError('Some privilege not exists');
            existingReport.hours = hours;
            existingReport.studies = studies;
            existingReport.observations = observations;
            existingReport.privileges = publisher.privileges;
            await reportRepository_1.reportRepository.save(existingReport).then(updatedReport => {
                return res.status(200).json(updatedReport);
            }).catch(err => {
                console.log(err);
            });
        }
        else {
            const privilegesExists = (_b = publisher.privileges) === null || _b === void 0 ? void 0 : _b.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
            if (!privilegesExists)
                throw new api_errors_1.BadRequestError('Some privilege not exists');
            const newReport = reportRepository_1.reportRepository.create({
                month: month,
                year,
                publisher: publisherExists,
                privileges: publisher.privileges,
                hours,
                studies,
                observations
            });
            await reportRepository_1.reportRepository.save(newReport).then(createdReport => {
                return res.status(201).json(createdReport);
            }).catch(err => {
                console.log(err);
            });
        }
    }
}
exports.default = new ReportController();
