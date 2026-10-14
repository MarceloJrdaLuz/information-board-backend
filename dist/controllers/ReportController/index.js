"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const publisherRepository_1 = require("../../repositories/publisherRepository");
const api_errors_1 = require("../../helpers/api-errors");
const reportRepository_1 = require("../../repositories/reportRepository");
const enumWeekDays_1 = require("../../types/enumWeekDays");
const Publisher_1 = require("../../entities/Publisher");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const privileges_1 = require("../../types/privileges");
const userRepository_1 = require("../../repositories/userRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
const permissions_1 = require("../../middlewares/permissions");
const publisherPrivilegeHelper_1 = require("../../helpers/publisherPrivilegeHelper");
const privilegesTranslations_1 = require("../../helpers/privilegesTranslations");
const privilegeRepository_1 = require("../../repositories/privilegeRepository");
const publisherPrivilegeRepository_1 = require("../../repositories/publisherPrivilegeRepository");
const dayjs_1 = __importDefault(require("dayjs"));
class ReportController {
    async create(req, res) {
        const { month, year, publisher_id, hours, studies, observations } = req.body;
        if (!Object.values(enumWeekDays_1.Months).some(enumMonth => enumMonth === month)) {
            return res.status(400).json({ message: 'Invalid month value' });
        }
        const publisherExists = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id: publisher_id
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });
        if (!publisherExists)
            throw new api_errors_1.NotFoundError('Publisher was not found');
        if (!(0, publisherPrivilegeHelper_1.hasPrivilege)(publisherExists, privileges_1.PrivilegeCode.PUBLISHER)) {
            throw new api_errors_1.BadRequestError('This person is not an approved publisher');
        }
        if (publisherExists.situation === Publisher_1.Situation.Removido || publisherExists.situation === Publisher_1.Situation.Desassociado) {
            throw new api_errors_1.BadRequestError('Publisher is not authorized to submit reports');
        }
        const monthRange = (0, privilegesTranslations_1.getMonthDateRange)(month, year);
        const targetDate = monthRange ? new Date(monthRange.startDate) : new Date();
        const activePrivileges = (0, publisherPrivilegeHelper_1.getActivePrivilegeNamesPT)(publisherExists, targetDate);
        let existingReport = await reportRepository_1.reportRepository.findOne({
            where: {
                month: month,
                year,
                publisher: {
                    id: publisherExists.id
                }
            }
        });
        if (existingReport) {
            existingReport.hours = hours;
            existingReport.studies = studies;
            existingReport.observations = observations;
            if (!existingReport.privileges || existingReport.privileges.length === 0) {
                existingReport.privileges = activePrivileges;
            }
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
                privileges: activePrivileges,
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
            relations: ["publisher", "publisher.privilegesRelation", "publisher.privilegesRelation.privilege"],
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
            relations: ["publisher", "publisher.privilegesRelation", "publisher.privilegesRelation.privilege"],
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
                id: publisher.id
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });
        if (!publisherExists)
            throw new api_errors_1.NotFoundError('Publisher was not found');
        const monthRange = (0, privilegesTranslations_1.getMonthDateRange)(month, year);
        const targetDate = monthRange ? new Date(monthRange.startDate) : new Date();
        let reportPrivileges;
        if ((publisher === null || publisher === void 0 ? void 0 : publisher.privileges) && Array.isArray(publisher.privileges) && publisher.privileges.length > 0) {
            reportPrivileges = publisher.privileges;
        }
        else {
            reportPrivileges = (0, publisherPrivilegeHelper_1.getActivePrivilegeNamesPT)(publisherExists, targetDate);
        }
        // Sincroniza designação de Pioneiro Auxiliar para o mês
        if (monthRange) {
            const formattedLegacyMonth = `${privilegesTranslations_1.PT_MONTH_NAMES[monthRange.monthIndex]}-${year}`;
            const isAuxSelected = reportPrivileges.some(p => p === "Pioneiro Auxiliar" || p === privileges_1.Privileges.PIONEIROAUXILIAR);
            let auxPrivilege = await privilegeRepository_1.privilegeRepository.findOne({
                where: [{ code: privileges_1.PrivilegeCode.AUXILIARY_PIONEER }, { name: "Auxiliary Pioneer" }]
            });
            if (!auxPrivilege) {
                auxPrivilege = await privilegeRepository_1.privilegeRepository.save({
                    code: privileges_1.PrivilegeCode.AUXILIARY_PIONEER,
                    name: "Auxiliary Pioneer"
                });
            }
            let pubMonths = publisherExists.pioneerMonths ? [...publisherExists.pioneerMonths] : [];
            let publisherUpdated = false;
            if (isAuxSelected) {
                if (!pubMonths.some(pm => pm.trim().toLowerCase() === formattedLegacyMonth.toLowerCase())) {
                    pubMonths.push(formattedLegacyMonth);
                    publisherExists.pioneerMonths = pubMonths;
                    publisherUpdated = true;
                }
                const existingAuxPrivilege = (_a = publisherExists.privilegesRelation) === null || _a === void 0 ? void 0 : _a.find(pp => {
                    var _a, _b;
                    return (((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.code) === privileges_1.PrivilegeCode.AUXILIARY_PIONEER ||
                        ((_b = pp.privilege) === null || _b === void 0 ? void 0 : _b.name) === "Auxiliary Pioneer") &&
                        (0, dayjs_1.default)(pp.startDate).format("YYYY-MM-DD") === monthRange.startDate &&
                        (0, dayjs_1.default)(pp.endDate).format("YYYY-MM-DD") === monthRange.endDate;
                });
                if (!existingAuxPrivilege) {
                    const newPriv = await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher: publisherExists,
                        publisherId: publisherExists.id,
                        privilege: auxPrivilege,
                        privilegeId: auxPrivilege.id,
                        startDate: monthRange.startDate,
                        endDate: monthRange.endDate
                    });
                    if (!publisherExists.privilegesRelation) {
                        publisherExists.privilegesRelation = [];
                    }
                    publisherExists.privilegesRelation.push(newPriv);
                }
            }
            else {
                if (pubMonths.some(pm => pm.trim().toLowerCase() === formattedLegacyMonth.toLowerCase())) {
                    pubMonths = pubMonths.filter(pm => pm.trim().toLowerCase() !== formattedLegacyMonth.toLowerCase());
                    publisherExists.pioneerMonths = pubMonths;
                    publisherUpdated = true;
                }
                const existingAuxPrivilege = (_b = publisherExists.privilegesRelation) === null || _b === void 0 ? void 0 : _b.find(pp => {
                    var _a, _b;
                    return (((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.code) === privileges_1.PrivilegeCode.AUXILIARY_PIONEER ||
                        ((_b = pp.privilege) === null || _b === void 0 ? void 0 : _b.name) === "Auxiliary Pioneer") &&
                        (0, dayjs_1.default)(pp.startDate).format("YYYY-MM-DD") === monthRange.startDate &&
                        (0, dayjs_1.default)(pp.endDate).format("YYYY-MM-DD") === monthRange.endDate;
                });
                if (existingAuxPrivilege) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.remove(existingAuxPrivilege);
                    publisherExists.privilegesRelation = publisherExists.privilegesRelation.filter(pp => pp.id !== existingAuxPrivilege.id);
                }
            }
            if (publisherUpdated) {
                await publisherRepository_1.publisherRepository.update(publisherExists.id, {
                    pioneerMonths: pubMonths
                });
            }
        }
        let existingReport = await reportRepository_1.reportRepository.findOne({
            where: {
                month: month,
                year,
                publisher: {
                    id: publisherExists.id
                }
            }
        });
        if (existingReport) {
            existingReport.hours = hours;
            existingReport.studies = studies;
            existingReport.observations = observations;
            existingReport.privileges = reportPrivileges;
            const updatedReport = await reportRepository_1.reportRepository.save(existingReport);
            return res.status(200).json(updatedReport);
        }
        else {
            const newReport = reportRepository_1.reportRepository.create({
                month: month,
                year,
                publisher: publisherExists,
                privileges: reportPrivileges,
                hours,
                studies,
                observations
            });
            const createdReport = await reportRepository_1.reportRepository.save(newReport);
            return res.status(201).json(createdReport);
        }
    }
}
exports.default = new ReportController();
