"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const publisherRepository_1 = require("../../repositories/publisherRepository");
const api_errors_1 = require("../../helpers/api-errors");
const reportRepository_1 = require("../../repositories/reportRepository");
const enumWeekDays_1 = require("../../types/enumWeekDays");
const congregationRepository_1 = require("../../repositories/congregationRepository");
class ReportController {
    async create(req, res) {
        const { month, year, publisher, publications, videos, hours, revisits, studies, observations } = req.body;
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
            existingReport.publications = publications;
            existingReport.videos = videos;
            existingReport.hours = hours;
            existingReport.revisits = revisits;
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
                publications,
                videos,
                hours,
                revisits,
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
            month: report.month,
            year: report.year,
            publications: report.publications,
            videos: report.videos,
            hour: report.hours,
            revisits: report.revisits,
            studies: report.studies,
            observations: report.observations,
            publisher: {
                ...report.publisher
            }
        }));
        res.json(response);
    }
}
exports.default = new ReportController();
