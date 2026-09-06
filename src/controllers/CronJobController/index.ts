import { exec } from "child_process"
import dayjs from "dayjs"
import { Request, Response } from "express"
import moment from "moment-timezone"
import { And, Between, IsNull, LessThan, Not } from "typeorm"
import { config } from "../../config"
import { MidweekRoom } from "../../entities/MidweekMeetingPart"
import { NotificationType } from "../../entities/Notification"
import { getMonthsOld } from "../../functions/getMonths"
import { resolveReminderOccurrence } from "../../helpers/resolveReminderOccurrence"
import { meetingAssistanceRepository } from "../../repositories/meetingAssistanceRepository"
import { noticeRepository } from "../../repositories/noticeRepository"
import { reportRepository } from "../../repositories/reportRepository"
//@ts-expect-error
import mailer from '../../modules/mailer'
import { cleaningExceptionRepository } from "../../repositories/cleaningExceptionRepository"
import { cleaningScheduleRepository } from "../../repositories/cleaningScheduleRepository"
import { externalTalkRepository } from "../../repositories/externalTalkRepository"
import { fieldServiceExceptionRepository } from "../../repositories/fieldServiceExceptionRepository"
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository"
import { fieldServiceTemplateLocationOverrideRepository } from "../../repositories/fieldServiceTemplateLocationOverrideRepository"
import { hospitalityAssignmentRepository } from "../../repositories/hospitalityAssignmentRepository"
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository"
import { publicWitnessAssignmentRepository } from "../../repositories/publicWitnessAssignmentRepository"
import { publisherReminderRepository } from "../../repositories/publisherReminderRepository"
import { territoryHistoryRepository } from "../../repositories/territoryHistoryRepository"
import { weekendScheduleRepository } from "../../repositories/weekendScheduleRepository"
import { mechanicalScheduleRepository } from "../../repositories/mechanicalScheduleRepository"
import { MechanicalMeetingType, MechanicalRole, MechanicalRoleLabels } from "../../types/mechanical"
import { pushNotificationService } from "../../services/pushNotificationService"

class CronJobController {
    async deleteExpiredNotices(req: Request, res: Response) {
        const startOfToday = moment().startOf("day").toDate();

        try {
            const expiredNotices = await noticeRepository.find({
                where: {
                    expired: LessThan(startOfToday),
                },
            });

            if (expiredNotices.length === 0) {
                return res.status(200).json({
                    message: "No expired notices found",
                    deleted: 0,
                });
            }

            await noticeRepository.remove(expiredNotices);

            return res.status(200).json({
                message: "Expired notices deleted",
                deleted: expiredNotices.length,
                notices: expiredNotices,
            });
        } catch (error) {
            console.error(error);
            throw new Error("Error deleting expired notices");
        }
    }

    async cleanOldPublisherReminders(req: Request, res: Response) {

        const today = dayjs().startOf("day").format("YYYY-MM-DD");

        try {

            const result = await publisherReminderRepository.delete({
                isRecurring: false,
                endDate: And(
                    Not(IsNull()),
                    LessThan(today)
                )
            });

            const deleted = result.affected ?? 0;

            return res.json({
                message: "Old publisher reminders cleaned",
                deleted
            });

        } catch (error: any) {

            console.error(error);

            return res.status(500).json({
                message: "Error cleaning old publisher reminders",
                error: error.message
            });

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
                    limitDateOverrides: overrideLimitDate,
                    limitDateSchedules: scheduleLimitDate,
                    limitDateExceptions: exceptionLimitDate
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

    /**
     * Cron Job diário para disparar notificações push de lembretes pessoais e designações
     */
    async dispatchDailyNotifications(req: Request, res: Response) {
        const today = dayjs().startOf("day")
        const todayStr = today.format("YYYY-MM-DD")
        const tomorrow = today.add(1, "day")
        const tomorrowStr = tomorrow.format("YYYY-MM-DD")

        let notificationsSent = 0
        const sentDetails: any[] = []
        const errors: any[] = []

        const sendNotification = async (pubId: string, payload: any, errorType: string, extraErrorData: any = {}) => {
            try {
                const result = await pushNotificationService.sendToPublisher(pubId, payload)
                if (result) {
                    notificationsSent++
                    sentDetails.push({
                        publisherId: pubId,
                        type: payload.type,
                        title: payload.title,
                        body: payload.body
                    })
                }
            } catch (err: any) {
                errors.push({ type: errorType, publisherId: pubId, error: err.message, ...extraErrorData })
            }
        }

        try {
            // ==========================================
            // 1. LEMBRETES PESSOAIS DO DIA
            // ==========================================
            const activeReminders = await publisherReminderRepository.find({
                where: { isActive: true },
                relations: ["publisher"]
            })

            for (const reminder of activeReminders) {
                if (!reminder.publisher) continue
                const occurrence = resolveReminderOccurrence(reminder, today)
                if (occurrence) {
                    await sendNotification(reminder.publisher.id, {
                        title: `Lembrete: ${occurrence.title}`,
                        body: occurrence.description || "Você tem um lembrete pessoal agendado para hoje.",
                        type: NotificationType.REMINDER,
                        data: { url: "/dashboard", reminderId: reminder.id }
                    }, "REMINDER", { reminderId: reminder.id })
                }
            }

            // ==========================================
            // 2. DESIGNAÇÕES DE REUNIÃO DE FIM DE SEMANA (Hoje e Amanhã)
            // ==========================================
            const weekendSchedules = await weekendScheduleRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["chairman", "reader", "speaker", "speaker.publisher", "talk", "congregation"]
            })

            for (const s of weekendSchedules) {
                const isToday = s.date === todayStr
                const timeLabel = isToday ? "hoje" : "amanhã"

                // Presidente
                if (s.chairman?.id) {
                    await sendNotification(s.chairman.id, {
                        title: "Designação de Presidente",
                        body: `Você está designado como Presidente da Reunião ${timeLabel} (${dayjs(s.date).format("DD/MM")}).`,
                        type: NotificationType.CHAIRMAN,
                        data: { url: "/dashboard", date: s.date }
                    }, "CHAIRMAN")
                }

                // Leitor
                if (s.reader?.id) {
                    await sendNotification(s.reader.id, {
                        title: "Designação de Leitor",
                        body: `Você está designado como Leitor da revista A Sentinela ${timeLabel} (${dayjs(s.date).format("DD/MM")}).`,
                        type: NotificationType.READING,
                        data: { url: "/dashboard", date: s.date }
                    }, "READING")
                }

                // Orador local
                if (s.speaker?.publisher?.id) {
                    const talkTitle = s.talk?.title ? ` - Tema: "${s.talk.title}"` : ""
                    await sendNotification(s.speaker.publisher.id, {
                        title: "Designação de Orador",
                        body: `Você proferirá o discurso público ${timeLabel} (${dayjs(s.date).format("DD/MM")})${talkTitle}.`,
                        type: NotificationType.SPEAKER,
                        data: { url: "/dashboard", date: s.date }
                    }, "SPEAKER")
                }
            }

            // ==========================================
            // 3. DESIGNAÇÕES DE LIMPEZA DO SALÃO (Hoje e Amanhã)
            // ==========================================
            const cleaningSchedules = await cleaningScheduleRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["group", "group.publishers"]
            })

            for (const c of cleaningSchedules) {
                const isToday = c.date === todayStr
                const timeLabel = isToday ? "hoje" : "amanhã"
                const publishers = c.group?.publishers || []

                for (const pub of publishers) {
                    await sendNotification(pub.id, {
                        title: "Limpeza do Salão do Reino",
                        body: `Seu grupo (${c.group?.name || "Limpeza"}) está escalado para a limpeza do salão ${timeLabel} (${dayjs(c.date).format("DD/MM")}).`,
                        type: NotificationType.CLEANING,
                        data: { url: "/dashboard", date: c.date }
                    }, "CLEANING")
                }
            }

            // ==========================================
            // 4. DESIGNAÇÕES DE SAÍDA DE CAMPO (Hoje e Amanhã)
            // ==========================================
            const fieldServiceSchedules = await fieldServiceScheduleRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["leader", "template"]
            })

            for (const fs of fieldServiceSchedules) {
                if (fs.leader?.id) {
                    const isToday = fs.date === todayStr
                    const timeLabel = isToday ? "hoje" : "amanhã"
                    const timeStr = fs.template?.time ? ` às ${fs.template.time}` : ""
                    const locStr = fs.template?.location ? ` (${fs.template.location})` : ""

                    await sendNotification(fs.leader.id, {
                        title: "Dirigente de Saída de Campo",
                        body: `Você está escalado como Dirigente de Campo ${timeLabel} (${dayjs(fs.date).format("DD/MM")})${timeStr}${locStr}.`,
                        type: NotificationType.FIELD_SERVICE,
                        data: { url: "/dashboard", date: fs.date }
                    }, "FIELD_SERVICE")
                }
            }

            // ==========================================
            // 5. TESTEMUNHO PÚBLICO (Hoje e Amanhã)
            // ==========================================
            const publicWitnessAssignments = await publicWitnessAssignmentRepository
                .createQueryBuilder("pw")
                .leftJoinAndSelect("pw.publishers", "allPublishers")
                .leftJoinAndSelect("allPublishers.publisher", "publisher")
                .leftJoinAndSelect("pw.timeSlot", "timeSlot")
                .leftJoinAndSelect("timeSlot.arrangement", "arrangement")
                .where("pw.date IN (:...dates)", { dates: [todayStr, tomorrowStr] })
                .getMany()

            for (const pw of publicWitnessAssignments) {
                const isToday = pw.date === todayStr
                const timeLabel = isToday ? "hoje" : "amanhã"
                const title = pw.timeSlot?.arrangement?.title || "Testemunho Público"
                const period = pw.timeSlot ? ` (${pw.timeSlot.start_time} - ${pw.timeSlot.end_time})` : ""

                for (const pubRel of pw.publishers || []) {
                    if (pubRel.publisher?.id) {
                        await sendNotification(pubRel.publisher.id, {
                            title: "Testemunho Público",
                            body: `Você tem designação no arranjo "${title}" ${timeLabel} (${dayjs(pw.date).format("DD/MM")})${period}.`,
                            type: NotificationType.PUBLICWITNESS,
                            data: { url: "/dashboard", date: pw.date }
                        }, "PUBLICWITNESS")
                    }
                }
            }

            // ==========================================
            // 6. DISCURSOS EXTERNOS (Hoje e Amanhã)
            // ==========================================
            const externalTalks = await externalTalkRepository.find({
                where: [
                    { date: todayStr },
                    { date: tomorrowStr }
                ],
                relations: ["speaker", "speaker.publisher", "destinationCongregation", "talk"]
            })

            for (const ext of externalTalks) {
                if (ext.speaker?.publisher?.id) {
                    const isToday = ext.date === todayStr
                    const timeLabel = isToday ? "hoje" : "amanhã"
                    const cong = ext.destinationCongregation?.name ? ` na congregação ${ext.destinationCongregation.name}` : ""

                    await sendNotification(ext.speaker.publisher.id, {
                        title: "Discurso fora",
                        body: `Você tem discurso fora agendado ${timeLabel} (${dayjs(ext.date).format("DD/MM")})${cong}.`,
                        type: NotificationType.SPEAKER,
                        data: { url: "/dashboard", date: ext.date }
                    }, "EXTERNAL_TALK")
                }
            }

            // ==========================================
            // 7. HOSPITALIDADE (Hoje e Amanhã)
            // ==========================================
            const hospitalityAssignments = await hospitalityAssignmentRepository.find({
                where: [
                    { weekend: { date: todayStr } },
                    { weekend: { date: tomorrowStr } }
                ],
                relations: ["group", "group.members", "group.host", "weekend"]
            })

            for (const h of hospitalityAssignments) {
                const isToday = h.weekend?.date === todayStr
                const timeLabel = isToday ? "hoje" : "amanhã"
                const dateFmt = dayjs(h.weekend?.date).format("DD/MM")

                // Host
                if (h.group?.host?.id) {
                    await sendNotification(h.group.host.id, {
                        title: "Arranjo de Hospitalidade",
                        body: `Você é o anfitrião do arranjo de hospitalidade ${timeLabel} (${dateFmt}).`,
                        type: NotificationType.HOSPITALITY,
                        data: { url: "/dashboard", date: h.weekend?.date }
                    }, "HOSPITALITY_HOST")
                }

                // Grupo
                for (const member of h.group?.members || []) {
                    if (member.id !== h.group?.host?.id) {
                        await sendNotification(member.id, {
                            title: "Arranjo de Hospitalidade",
                            body: `Seu grupo (${h.group?.name || ""}) está designado para o arranjo de hospitalidade ${timeLabel} (${dateFmt}).`,
                            type: NotificationType.HOSPITALITY,
                            data: { url: "/dashboard", date: h.weekend?.date }
                        }, "HOSPITALITY_MEMBER")
                    }
                }
            }

            // ==========================================
            // 8. NOTIFICAÇÃO CONSOLIDADA DA REUNIÃO DE MEIO DE SEMANA (Toda Segunda-feira)
            // ==========================================
            const isMonday = today.day() === 1 || req.query?.forceMidweek === "true" || req.body?.forceMidweek === true
            if (isMonday) {
                // Início (segunda) e fim (domingo) da semana atual
                const weekMonday = today.day() === 0 ? today.subtract(6, "day") : today.subtract(today.day() - 1, "day")
                const mondayStr = weekMonday.format("YYYY-MM-DD")
                const sundayStr = weekMonday.add(6, "day").format("YYYY-MM-DD")

                const midweekSchedules = await midweekScheduleRepository.find({
                    where: [
                        { weekDate: mondayStr },
                        { weekDate: Between(mondayStr, sundayStr) },
                        { meetingDate: Between(mondayStr, sundayStr) }
                    ],
                    relations: [
                        "congregation",
                        "chairman",
                        "openingPrayer",
                        "closingPrayer",
                        "auxCounselor1",
                        "auxCounselor2",
                        "cbsConductor",
                        "cbsReader",
                        "parts",
                        "parts.assignedPublisher",
                        "parts.assistantPublisher"
                    ],
                    order: {
                        parts: {
                            orderIndex: "ASC"
                        }
                    }
                })

                // Deduplica programações caso correspondam a mais de uma condição
                const uniqueSchedules = Array.from(new Map(midweekSchedules.map(s => [s.id, s])).values())

                // Busca designações mecânicas da reunião de meio de semana para o mesmo período
                const mechanicalMidweekSchedules = await mechanicalScheduleRepository.find({
                    where: [
                        { weekStartDate: mondayStr, meetingType: MechanicalMeetingType.MIDWEEK },
                        { weekStartDate: Between(mondayStr, sundayStr), meetingType: MechanicalMeetingType.MIDWEEK },
                        { date: Between(mondayStr, sundayStr), meetingType: MechanicalMeetingType.MIDWEEK }
                    ],
                    relations: [
                        "congregation",
                        "assignments",
                        "assignments.publisher"
                    ],
                    order: {
                        assignments: {
                            order: "ASC"
                        }
                    }
                })

                const uniqueMechanicalSchedules = Array.from(new Map(mechanicalMidweekSchedules.map(s => [s.id, s])).values())
                const processedMechScheduleIds = new Set<string>()

                const formatMechanicalRole = (role: MechanicalRole, order?: number) => {
                    const roleLabel = MechanicalRoleLabels[role] || role
                    const roleWithOrder =
                        order && order > 1 && (role === MechanicalRole.ATTENDANT || role === MechanicalRole.ROVING_MIC || role === MechanicalRole.STAGE_MIC)
                            ? `${roleLabel} ${order}`
                            : roleLabel
                    return `${roleWithOrder} (Tarefa Mecânica)`
                }

                const getRoomSuffix = (room?: MidweekRoom) => {
                    if (room === MidweekRoom.AUXILIARY_1) return " (Sala Auxiliar 1)"
                    if (room === MidweekRoom.AUXILIARY_2) return " (Sala Auxiliar 2)"
                    return ""
                }

                for (const schedule of uniqueSchedules) {
                    const meetingDateObj = schedule.meetingDate ? dayjs(schedule.meetingDate) : dayjs(schedule.weekDate)
                    const meetingDateFmt = meetingDateObj.format("DD/MM")

                    // Mapeia designações por publicador para agrupar em uma só notificação
                    const pubMap = new Map<string, { id: string; name?: string; items: string[] }>()

                    const addAssignment = (pub: { id: string; name?: string } | null | undefined, desc: string) => {
                        if (!pub?.id) return
                        if (!pubMap.has(pub.id)) {
                            pubMap.set(pub.id, { id: pub.id, name: pub.name, items: [] })
                        }
                        pubMap.get(pub.id)!.items.push(desc)
                    }

                    if (schedule.chairman?.id) addAssignment(schedule.chairman, "Presidente da Reunião")
                    if (schedule.openingPrayer?.id) addAssignment(schedule.openingPrayer, "Oração Inicial")
                    if (schedule.closingPrayer?.id) addAssignment(schedule.closingPrayer, "Oração Final")
                    if (schedule.auxCounselor1?.id) addAssignment(schedule.auxCounselor1, "Conselheiro - Sala Auxiliar 1")
                    if (schedule.auxCounselor2?.id) addAssignment(schedule.auxCounselor2, "Conselheiro - Sala Auxiliar 2")
                    if (schedule.cbsConductor?.id) addAssignment(schedule.cbsConductor, "Dirigente do Estudo Bíblico de Congregação")
                    if (schedule.cbsReader?.id) addAssignment(schedule.cbsReader, "Leitor do Estudo Bíblico de Congregação")

                    const activeParts = (schedule.parts || [])
                        .filter(p => p.isActive !== false)
                        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

                    for (const part of activeParts) {
                        const roomSuffix = getRoomSuffix(part.room)

                        // Titular da parte
                        if (part.assignedPublisher?.id) {
                            let desc = part.title || "Parte"
                            const assistantName = part.assistantPublisher?.nickname || part.assistantPublisher?.fullName
                            if (assistantName) {
                                desc += ` (com ${assistantName})`
                            }
                            desc += roomSuffix
                            addAssignment(part.assignedPublisher, desc)
                        }

                        // Ajudante da parte
                        if (part.assistantPublisher?.id) {
                            let desc = `${part.title || "Parte"} - Ajudante`
                            const titularName = part.assignedPublisher?.nickname || part.assignedPublisher?.fullName
                            if (titularName) {
                                desc += ` de ${titularName}`
                            }
                            desc += roomSuffix
                            addAssignment(part.assistantPublisher, desc)
                        }
                    }

                    // Anexa tarefas mecânicas da congregação para a mesma semana na notificação consolidada
                    const scheduleCongId = schedule.congregation?.id || (schedule as any).congregation_id
                    const matchingMechSchedules = uniqueMechanicalSchedules.filter(
                        ms => (ms.congregation_id === scheduleCongId || ms.congregation?.id === scheduleCongId) && !ms.hasNoMeeting
                    )

                    for (const mechSched of matchingMechSchedules) {
                        processedMechScheduleIds.add(mechSched.id)
                        for (const ma of mechSched.assignments || []) {
                            if (ma.publisher?.id) {
                                addAssignment(ma.publisher, formatMechanicalRole(ma.role, ma.order))
                            }
                        }
                    }

                    for (const [pubId, digest] of pubMap.entries()) {
                        const itemsList = digest.items.map(item => `• ${item}`).join("\n")
                        const title = `Reunião Meio de Semana (${meetingDateFmt})`
                        const body = digest.items.length === 1
                            ? `Você tem 1 designação nesta semana:\n${itemsList}`
                            : `Você tem ${digest.items.length} designações nesta semana:\n${itemsList}`

                        await sendNotification(pubId, {
                            title,
                            body,
                            type: NotificationType.REMINDER,
                            data: {
                                url: "/dashboard",
                                scheduleId: schedule.id,
                                meetingDate: schedule.meetingDate || schedule.weekDate
                            }
                        }, "MIDWEEK_WEEKLY_DIGEST", { scheduleId: schedule.id })
                    }
                }

                // Caso existam congregações com tarefas mecânicas cadastradas mas sem programação de meio de semana no banco
                const remainingMechSchedules = uniqueMechanicalSchedules.filter(
                    ms => !processedMechScheduleIds.has(ms.id) && !ms.hasNoMeeting
                )

                for (const mechSched of remainingMechSchedules) {
                    const meetingDateObj = mechSched.date ? dayjs(mechSched.date) : dayjs(mechSched.weekStartDate)
                    const meetingDateFmt = meetingDateObj.format("DD/MM")

                    const pubMap = new Map<string, { id: string; name?: string; items: string[] }>()

                    const addAssignment = (pub: { id: string; name?: string } | null | undefined, desc: string) => {
                        if (!pub?.id) return
                        if (!pubMap.has(pub.id)) {
                            pubMap.set(pub.id, { id: pub.id, name: pub.name, items: [] })
                        }
                        pubMap.get(pub.id)!.items.push(desc)
                    }

                    for (const ma of mechSched.assignments || []) {
                        if (ma.publisher?.id) {
                            addAssignment(ma.publisher, formatMechanicalRole(ma.role, ma.order))
                        }
                    }

                    for (const [pubId, digest] of pubMap.entries()) {
                        const itemsList = digest.items.map(item => `• ${item}`).join("\n")
                        const title = `Reunião Meio de Semana (${meetingDateFmt})`
                        const body = digest.items.length === 1
                            ? `Você tem 1 designação nesta semana:\n${itemsList}`
                            : `Você tem ${digest.items.length} designações nesta semana:\n${itemsList}`

                        await sendNotification(pubId, {
                            title,
                            body,
                            type: NotificationType.REMINDER,
                            data: {
                                url: "/dashboard",
                                scheduleId: mechSched.id,
                                meetingDate: mechSched.date || mechSched.weekStartDate
                            }
                        }, "MIDWEEK_WEEKLY_DIGEST", { scheduleId: mechSched.id })
                    }
                }
            }

            return res.json({
                message: "Daily notifications dispatched successfully",
                notificationsSent,
                sentDetails,
                errorsCount: errors.length,
                errors: errors.length > 0 ? errors : undefined,
            })
        } catch (error: any) {
            console.error("Error dispatching daily notifications:", error)
            return res.status(500).json({
                message: "Error dispatching daily notifications",
                error: error.message
            })
        }
    }
}

export default new CronJobController()
