import { Request, Response } from "express";
import { CustomRequest, ParamsCustomRequest } from "../../types/customRequest";
import { BodyReportCreateTypes, ParamsGetReportsTypes } from "./types";
import { publisherRepository } from "../../repositories/publisherRepository";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { reportRepository } from "../../repositories/reportRepository";
import { Months } from "../../types/enumWeekDays";
import { Publisher } from "../../entities/Publisher";
import { FindOperator, Not } from "typeorm";
import { congregationRepository } from "../../repositories/congregationRepository";
import { Report } from "../../entities/Report";

class ReportController {
  async create(req: CustomRequest<BodyReportCreateTypes>, res: Response) {
    const { month, year, publisher, publications, videos, hours, revisits, studies, observations } = req.body
    
    if (!Object.values(Months).some(enumMonth => enumMonth === month)) {
      return res.status(400).json({ message: 'Invalid month value' });
    }

    const publisherExists = await publisherRepository.findOne({
      where: {
        fullName: publisher.fullName,
        nickname: publisher.nickName,
        congregation: {
          id: publisher.congregation_id
        }
      }
    });

    if (!publisherExists) throw new NotFoundError('Publisher was not found');

    let existingReport = await reportRepository.findOne({
      where: {
        month: month as Months,
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

      await reportRepository.save(existingReport).then(updatedReport => {
        return res.status(200).json(updatedReport);
      }).catch(err => {
        console.log(err);
      });
    } else {
      const newReport = reportRepository.create({
        month: month as Months,
        year,
        publisher: publisherExists,
        publications,
        videos,
        hours,
        revisits,
        studies,
        observations
      });

      await reportRepository.save(newReport).then(createdReport => {
        return res.status(201).json(createdReport);
      }).catch(err => {
        console.log(err);
      });
    }
  }

  async getReports(req: ParamsCustomRequest<ParamsGetReportsTypes>, res: Response) {
    const { congregationId } = req.params

    const congregation = await congregationRepository.findOneBy({ id: congregationId })

    if (!congregation) throw new NotFoundError('Congregation was not found')

    const reports = await reportRepository.find({
      where: {
        publisher: {
          congregation: {
            id: congregationId,
          },
        },
      },
      relations: ["publisher"],
    })

    if (reports.length === 0) throw new NotFoundError('Any report in this congregation was found')

    const response = reports.map(report => ({
      month: report.month,
      year: report.year,
      publications: report.publications,
      videos: report.videos,
      hours: report.hours,
      revisits: report.revisits,
      studies: report.studies,
      observations: report.observations,
      publisher: {
        ...report.publisher
      }
    }))

    res.json(response)

  }

}

export default new ReportController()