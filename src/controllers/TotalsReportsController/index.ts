import { Response } from "express"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { BodyTotalsReportsCreateTypes, ParamsTotalsReportsCreateTypes } from "./types"
import { congregationRepository } from "../../repositories/congregationRepository"
import { NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { totalsReportsRepository } from "../../repositories/totalsReportRepository"
import { Months } from "../../types/enumWeekDays"

class TotalsReportsController {
  async create(req: CustomRequestPT<ParamsTotalsReportsCreateTypes, BodyTotalsReportsCreateTypes>, res: Response) {
    const { congregation_id } = req.params
    const { totals } = req.body

    const congregation = await congregationRepository.findOneBy({ id: congregation_id })

    if (!congregation) {
      throw new NotFoundError(messageErrors.notFound.congregation)
    }

    for (const total of totals) {
      if (!Object.values(Months).some(enumMonth => enumMonth === total.month)) {
        return res.status(400).json({ message: 'Invalid month value' })
      }

      const newTotalReports = totalsReportsRepository.create({
        congregation,
        month: total.month as Months,
        year: total.year,
        publishersActives: total.publishersActives,
        privileges: total.privileges,
        quantity: total.quantity,
        hours: total.hours ?? 0,
        studies: total.studies ?? 0,
      })

      await totalsReportsRepository.save(newTotalReports).then(updatedReport => {
        return res.status(200).json(updatedReport)
      }).catch(err => {
        console.log(err)
      })
    }
    res.send()
  }

  async get(req: ParamsCustomRequest<ParamsTotalsReportsCreateTypes>, res: Response) {
    const { congregation_id } = req.params

    const congregation = await congregationRepository.findOneBy({ id: congregation_id })

    if (!congregation) {
      throw new NotFoundError(messageErrors.notFound.congregation)
    }

    const totals = await totalsReportsRepository.find({
      where: {
        congregation: {
          id: congregation.id
        }
      }
    })
    res.send(totals)
  }
}
export default new TotalsReportsController()