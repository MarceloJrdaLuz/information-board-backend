import { Response, Request } from "express"
import { noticeRepository } from "../../repositories/noticeRepository"
import { LessThan } from "typeorm"
import { NotFoundError } from "../../helpers/api-errors"
import moment from "moment-timezone"
import { reportRepository } from "../../repositories/reportRepository"
import { getMonthsOld } from "../../functions/getMonths"
import { meetingAssistanceRepository } from "../../repositories/meetingAssistanceRepository"
//@ts-expect-error
import mailer from '../../modules/mailer'
import { exec } from "child_process"
import { config } from "../../config"
import { PassThrough } from "stream"
import fs from 'fs'
import path from "path"


class CronJobController {
    async deleteExpiredNotices(req: Request, res: Response) {
        const startOfToday = moment().startOf('day').toDate()

        const expiredNotices = await noticeRepository.find({
            where: {
                expired: LessThan(startOfToday)
            }
        })

        if (expiredNotices.length === 0) {
            throw new NotFoundError("No expired notices found")
        }

        try {
            await noticeRepository.remove(expiredNotices)
            return res.status(200).json({ message: "Expired notices deleted", notices: expiredNotices })
        } catch (error) {
            console.log(error)
            throw new Error("Error deleting expired notices")
        }

    }
    async reportsCleanUp(req: Request, res: Response) {
        const monthsListReports = getMonthsOld(3)
        const monthsListMeetingAssistance = getMonthsOld(4)

        const reports = await reportRepository.find()
        const meetingAssistance = await meetingAssistanceRepository.find()

        const filterMeetingAssistance = meetingAssistance.filter(meet => {
            const meetingAssitance = `${meet.month.toLowerCase()} ${meet.year}`
            return monthsListMeetingAssistance.includes(meetingAssitance)
        })

        const filterReports = reports.filter(report => {
            const reportMonthYear = `${report.month.toLowerCase()} ${report.year}`
            return monthsListReports.includes(reportMonthYear)
        })

        if (filterMeetingAssistance.length > 0) {
            console.log(`${filterMeetingAssistance.length} Meeting Assistance records were deleted`)
            await meetingAssistanceRepository.remove(filterMeetingAssistance)
        }
        if (filterReports.length > 0) {
            console.log(`${filterReports.length} Reports records were deleted`)
            await reportRepository.remove(filterReports)
        }
        res.send()
    }

    async backup(req: Request, res: Response) {
        res.send()
    }
}

export default new CronJobController()