import { Response, Request } from "express"
import { noticeRepository } from "../../repositories/noticeRepository"
import { IsNull, LessThan, Not } from "typeorm"
import { NotFoundError } from "../../helpers/api-errors"
import moment from "moment-timezone"
import { reportRepository } from "../../repositories/reportRepository"
import { getMonthsOld } from "../../functions/getMonths"
import { meetingAssistanceRepository } from "../../repositories/meetingAssistanceRepository"
//@ts-expect-error
import mailer from '../../modules/mailer'
import { exec } from "child_process"
import { config } from "../../config"
import { cleaningScheduleRepository } from "../../repositories/cleaningScheduleRepository"
import dayjs from "dayjs"
import { cleaningExceptionRepository } from "../../repositories/cleaningExceptionRepository"
import { fieldServiceTemplateLocationOverrideRepository } from "../../repositories/fieldServiceTemplateLocationOverrideRepository"
import { territoryHistoryRepository } from "../../repositories/territoryHistoryRepository"
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository"
import { fieldServiceExceptionRepository } from "../../repositories/fieldServiceExceptionRepository"

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

        const dateNow = moment().format("DD/MM/YYYY")

        const dumpCommand = `pg_dump -U ${config.db_user} -h ${config.db_host} -p ${config.db_port} -d ${config.db_name}`

        const child = exec(
            dumpCommand,
            {
                maxBuffer: 1024 * 1024 * 10,
                env: { ...process.env, PGPASSWORD: config.db_pass },
            },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing pg_dump command:', error)
                    return res.status(500).send({ message: 'Error executing database dump' })
                }

                if (stderr) {
                    console.error('pg_dump stderr:', stderr)
                }

                // Send the email with the backup after capturing stdout
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: config.email_backup, // Can send to your own email for testing
                    subject: 'Database Backup',
                    text: 'Attached is the database backup.',
                    template: "backup/index",
                    attachments: [
                        {
                            filename: `${dateNow} backup.sql`,
                            content: stdout, // Attach the captured stdout directly as content
                        },
                    ],
                }

                mailer.sendMail(mailOptions, (err: any, info: any) => {
                    if (err) {
                        console.error('Error sending email:', err)
                        return res.status(500).send({ message: "Error sending email" })
                    }

                    console.log('Email sent:', info.response)
                    res.send({ message: 'Backup successfully emailed' })
                })
            }
        )
    }

    async cleanTerritoryHistory(req: Request, res: Response) {
        try {

            const histories = await territoryHistoryRepository.find({
                where: {
                    completion_date: Not(IsNull())
                },
                relations: ["territory"],
                order: {
                    completion_date: "DESC"
                }
            })

            const grouped: Record<string, typeof histories> = {}

            for (const history of histories) {
                const territoryId = history.territory.id

                if (!grouped[territoryId]) {
                    grouped[territoryId] = []
                }

                grouped[territoryId].push(history)
            }

            const toDelete: typeof histories = []

            for (const territoryId in grouped) {
                const records = grouped[territoryId]

                if (records.length > 4) {
                    const excess = records.slice(4)
                    toDelete.push(...excess)
                }
            }

            if (toDelete.length > 0) {
                await territoryHistoryRepository.remove(toDelete)
            }

            const deleted = toDelete.length

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: config.email_backup,
                subject: "🧹 Limpeza de histórico de territórios concluída",
                template: "cleanup/territoryHistory",
                context: {
                    deleted
                }
            })

            return res.json({
                message: "Territory history cleanup completed",
                deleted
            })

        } catch (error: any) {

            console.error(error)

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: config.email_backup,
                subject: "❌ Falha na limpeza de histórico de territórios",
                template: "cleanup/error",
                context: {
                    error: error.message
                }
            })

            return res.status(500).json({
                message: "Error cleaning territory history",
                error: error.message
            })
        }
    }

    async cleanOldFieldService(req: Request, res: Response) {

        const overrideLimitDate = dayjs()
            .startOf("isoWeek")
            .format("YYYY-MM-DD");

        const scheduleLimitDate = dayjs()
            .subtract(6, "month")
            .format("YYYY-MM-DD");

        const exceptionLimitDate = dayjs()
            .subtract(1, "month")
            .format("YYYY-MM-DD");

        try {

            // limpa overrides antigos
            const overrideResult =
                await fieldServiceTemplateLocationOverrideRepository.delete({
                    week_start: LessThan(overrideLimitDate)
                });

            // limpa programações antigas
            const schedulesResult =
                await fieldServiceScheduleRepository.delete({
                    date: LessThan(scheduleLimitDate)
                });

            // limpa exceções antigas
            const exceptionsResult =
                await fieldServiceExceptionRepository.delete({
                    date: LessThan(exceptionLimitDate)
                });

            const deletedOverrides = overrideResult.affected ?? 0;
            const deletedSchedules = schedulesResult.affected ?? 0;
            const deletedExceptions = exceptionsResult.affected ?? 0;

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: config.email_backup,
                subject: "🧹 Limpeza semanal de saída de campo",
                template: "cleanup/fieldService",
                context: {
                    deletedOverrides,
                    deletedSchedules,
                    deletedExceptions,
                    overrideLimitDate,
                    scheduleLimitDate,
                    exceptionLimitDate
                }
            });

            return res.json({
                message: "Field service cleanup completed",
                deletedOverrides,
                deletedSchedules,
                deletedExceptions
            });

        } catch (error: any) {

            console.error(error);

            return res.status(500).json({
                message: "Error cleaning field service data",
                error: error.message
            });
        }
    }

    async cleanOldData(req: Request, res: Response) {
        const scheduleLimitDate = dayjs().subtract(12, "month").format("YYYY-MM-DD");
        const exceptionLimitDate = dayjs().subtract(6, "month").format("YYYY-MM-DD");

        try {
            // Apaga schedules antigos
            const schedulesResult = await cleaningScheduleRepository.delete({
                date: LessThan(scheduleLimitDate)
            });

            // Apaga exceptions antigas
            const exceptionsResult = await cleaningExceptionRepository.delete({
                date: LessThan(exceptionLimitDate)
            });

            const deletedSchedules = schedulesResult.affected ?? 0;
            const deletedExceptions = exceptionsResult.affected ?? 0;

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: config.email_backup,
                subject: "🧹 Limpeza automática concluída",
                template: "cleanup/success",
                context: {
                    deletedSchedules,
                    deletedExceptions,
                    scheduleLimitDate,
                    exceptionLimitDate,
                }
            });

            return res.json({
                message: "Cleanup completed",
                deletedSchedules,
                deletedExceptions,
            });
        } catch (error: any) {
            console.error("Cleanup error:", error);

            await mailer.sendMail({
                from: process.env.EMAIL_USER,
                to: config.email_backup,
                subject: "❌ Falha na limpeza automática",
                template: "cleanup/error",
                context: {
                    error: error.message
                }
            });

            return res.status(500).json({
                message: "Error cleaning old data",
                error: error.message
            });
        }
    }
}

export default new CronJobController()
