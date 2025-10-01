import { Request, Response } from "express"
import { CustomRequest, ParamsCustomRequest } from "../../types/customRequest"
import { BodyReportCreateManuallyTypes, BodyReportCreateTypes, BodyUpdatePrivilegeTypes, ParamsDeleteReportypes, ParamsGetMyReportstypes, ParamsGetReportsTypes } from "./types"
import { publisherRepository } from "../../repositories/publisherRepository"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { reportRepository } from "../../repositories/reportRepository"
import { Months } from "../../types/enumWeekDays"
import { Publisher } from "../../entities/Publisher"
import { FindOperator, Not } from "typeorm"
import { congregationRepository } from "../../repositories/congregationRepository"
import { Report } from "../../entities/Report"
import { Privileges } from "../../types/privileges"
import { userRepository } from "../../repositories/userRepository"
import { messageErrors } from "../../helpers/messageErrors"
import { decoder } from "../../middlewares/permissions"

class ReportController {
  async create(req: CustomRequest<BodyReportCreateTypes>, res: Response) {
    const { month, year, publisher_id, hours, studies, observations } = req.body

    if (!Object.values(Months).some(enumMonth => enumMonth === month)) {
      return res.status(400).json({ message: 'Invalid month value' })
    }

    const publisherExists = await publisherRepository.findOne({
      where: {
        id: publisher_id
      }
    })

    if (!publisherExists) throw new NotFoundError('Publisher was not found')

    let existingReport = await reportRepository.findOne({
      where: {
        month: month as Months,
        year,
        publisher: {
          id: publisherExists.id
        }
      }
    })

    if (existingReport) {
      existingReport.hours = hours
      existingReport.studies = studies
      existingReport.observations = observations

      await reportRepository.save(existingReport).then(updatedReport => {
        return res.status(200).json(updatedReport)
      }).catch(err => {
        console.log(err)
      })
    } else {
      const newReport = reportRepository.create({
        month: month as Months,
        year,
        publisher: publisherExists,
        hours,
        studies,
        observations
      })

      await reportRepository.save(newReport).then(createdReport => {
        return res.status(201).json(createdReport)
      }).catch(err => {
        console.log(err)
      })
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
    }))
    res.json(response)
  }

  async getMyReports(req: Request, res: Response) {
    const userLogged = await decoder(req)

    const user = await userRepository.findOne({ where: { id: userLogged.id }, relations: ["publisher"], select: ["publisher"] })

    if (!user) throw new NotFoundError(messageErrors.notFound.user)

    if (!user.publisher) throw new BadRequestError("You are not linked to a publisher yet")

    const reports = await reportRepository.find({
      where: {
        publisher: {
          id: user?.publisher?.id
        },
      },
    })

    res.json(reports)
  }

  async getReportsByMonth(req: ParamsCustomRequest<ParamsGetReportsTypes>, res: Response) {
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
    }))
    res.json(response)
  }

  async updatePrivilege(req: CustomRequest<BodyUpdatePrivilegeTypes>, res: Response) {
    const { reports } = req.body

    for (const report of reports) {
      // Encontre o relatório no banco de dados com base no report_id
      const existingReport = await reportRepository.findOneBy({ id: report.report_id });


      if (existingReport) {
        const privilegesExists = report.privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))

        if (!privilegesExists) throw new BadRequestError('Some privilege not exists')
        // Atualize o privilégio do relatório com os novos valores
        existingReport.privileges = report.privileges;

        // Salve a atualização no banco de dados
        await reportRepository.save(existingReport)
      }
    }

    res.send()
  }

  async deleteReport(req: ParamsCustomRequest<ParamsDeleteReportypes>, res: Response) {
    const { report_id: id } = req.params

    const report = await reportRepository.findOne({
      where: {
        id
      },
    })

    if (!report) throw new BadRequestError('Report not exists')

    await reportRepository.remove(report)

    return res.status(200).end()
  }

  async createReportManually(req: CustomRequest<BodyReportCreateManuallyTypes>, res: Response) {
    const { month, year, publisher, hours, studies, observations } = req.body

    if (!Object.values(Months).some(enumMonth => enumMonth === month)) {
      return res.status(400).json({ message: 'Invalid month value' })
    }

    const publisherExists = await publisherRepository.findOne({
      where: {
        id: publisher.id
      }
    })

    if (!publisherExists) throw new NotFoundError('Publisher was not found')


    let existingReport = await reportRepository.findOne({
      where: {
        month: month as Months,
        year,
        publisher: {
          id: publisherExists.id 
        }
      }
    })

    if (existingReport) {
      const privilegesExists = publisher.privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))

      if (!privilegesExists) throw new BadRequestError('Some privilege not exists')

      existingReport.hours = hours
      existingReport.studies = studies
      existingReport.observations = observations
      existingReport.privileges = publisher.privileges

      await reportRepository.save(existingReport).then(updatedReport => {
        return res.status(200).json(updatedReport)
      }).catch(err => {
        console.log(err)
      })
    } else {
      const privilegesExists = publisher.privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))

      if (!privilegesExists) throw new BadRequestError('Some privilege not exists')

      const newReport = reportRepository.create({
        month: month as Months,
        year,
        publisher: publisherExists,
        privileges: publisher.privileges,
        hours,
        studies,
        observations
      })

      await reportRepository.save(newReport).then(createdReport => {
        return res.status(201).json(createdReport)
      }).catch(err => {
        console.log(err)
      })
    }
  }
}
export default new ReportController()