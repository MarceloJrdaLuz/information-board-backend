import { Response } from "express"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { congregationRepository } from "../../repositories/congregationRepository"
import { NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { Months } from "../../types/enumWeekDays"
import { BodyMeetingAssistanceCreateTypes, ParamsMeetingAssistanceCreateTypes } from "./types"
import { meetingAssistanceRepository } from "../../repositories/meetingAssistanceRepository"

class TotalsReportsController {
  async create(req: CustomRequestPT<ParamsMeetingAssistanceCreateTypes, BodyMeetingAssistanceCreateTypes>, res: Response) {
    const { congregation_id } = req.params
    const { endWeek, midWeek, endWeekAverage, endWeekTotal, midWeekAverage, midWeekTotal, month, year } = req.body

    const congregation = await congregationRepository.findOneBy({ id: congregation_id })

    if (!congregation) {
      throw new NotFoundError(messageErrors.notFound.congregation)
    }

    if (!Object.values(Months).some(enumMonth => enumMonth === month)) {
      return res.status(400).json({ message: 'Invalid month value' })
    }

    let existsMeetingAssistance = await meetingAssistanceRepository.findOne({
      where: {
        month: month as Months,
        year,
        congregation: {
          id: congregation.id 
        }
      }
    })

    if (existsMeetingAssistance) {
      existsMeetingAssistance.endWeek = endWeek
      existsMeetingAssistance.endWeekTotal = endWeekTotal
      existsMeetingAssistance.endWeekAverage = endWeekAverage
      existsMeetingAssistance.midWeek = midWeek
      existsMeetingAssistance.midWeekTotal = midWeekTotal
      existsMeetingAssistance.midWeekAverage = midWeekAverage

      await meetingAssistanceRepository.save(existsMeetingAssistance).catch(err => console.log(err))
      res.send(existsMeetingAssistance)
    } else {
      const newMeetingAssistance = meetingAssistanceRepository.create({
        congregation,
        month: month as Months,
        year,
        endWeek,
        midWeek,
        endWeekAverage,
        endWeekTotal,
        midWeekAverage,
        midWeekTotal,
      })

      await meetingAssistanceRepository.save(newMeetingAssistance).catch(err => console.log(err))
      res.send(newMeetingAssistance)
    }


  }

  async getAssistance(req: ParamsCustomRequest<ParamsMeetingAssistanceCreateTypes>, res: Response) {
    const { congregation_id } = req.params

    const congregation = await congregationRepository.findOneBy({ id: congregation_id })

    if (!congregation) {
      throw new NotFoundError(messageErrors.notFound.congregation)
    }

    const meetingAssistance = await meetingAssistanceRepository.find({
      where: {
        congregation: {
          id: congregation.id
        }
      }
    })

    res.send(meetingAssistance)
  }
}
export default new TotalsReportsController()