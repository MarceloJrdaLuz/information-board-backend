import { Request, Response } from "express";
import { decoder } from "../../middlewares/permissions";
import { userRepository } from "../../repositories/userRepository";
import { publisherFieldActivityRepository } from "../../repositories/publisherFieldActivityRepository";
import { publisherBibleStudentRepository } from "../../repositories/publisherBibleStudentRepository";
import { publisherMonthBalanceRepository } from "../../repositories/publisherMonthBalanceRepository";
import { reportRepository } from "../../repositories/reportRepository";
import { totalsReportsRepository } from "../../repositories/totalsReportRepository";
import { NotFoundError, BadRequestError } from "../../helpers/api-errors";
import { Months } from "../../types/enumWeekDays";
import { Report } from "../../entities/Report";
import { Between } from "typeorm";
import dayjs from "dayjs";

export class DailyMinistryController {
    // Helper privado para obter o publicador logado
    private static async getLoggedPublisher(req: Request) {
        const userLogged = await decoder(req);
        const user = await userRepository.findOne({
            where: { id: userLogged.id },
            relations: ["publisher", "publisher.congregation", "publisher.group"]
        });

        if (!user) throw new NotFoundError("Usuário não encontrado");
        if (!user.publisher) throw new BadRequestError("Você ainda não está vinculado a um publicador");

        return user.publisher;
    }

    // Helper privado para verificar se o mês da congregação foi fechado pelo secretário ou por prazo expirado
    private static async assertMonthNotLocked(publisher: any, year: string | number, month: string | number) {
        const targetYear = String(year);
        const targetMonth = String(month).padStart(2, "0");

        const startOfTargetMonth = dayjs(`${targetYear}-${targetMonth}-01`);
        // Prazo limite: dia 20 do mês seguinte às 23:59:59
        const deadline = startOfTargetMonth.add(1, "month").date(20).endOf("day");

        const now = dayjs();
        if (now.isAfter(deadline)) {
            throw new BadRequestError(
                `O prazo para registrar ou alterar o relatório de ${startOfTargetMonth.format("MM/YYYY")} encerrou no dia 20 (os relatórios da congregação já foram enviados). Fale com o secretário caso precise de ajustes.`
            );
        }

        // Verifica se o secretário da congregação já registrou os totais do mês para Betel
        if (publisher?.congregation?.id) {
            const monthNamesEnum = [
                Months.JANEIRO, Months.FEVEREIRO, Months.MARCO, Months.ABRIL,
                Months.MAIO, Months.JUNHO, Months.JULHO, Months.AGOSTO,
                Months.SETEMBRO, Months.OUTUBRO, Months.NOVEMBRO, Months.DEZEMBRO
            ];
            const monthIndex = parseInt(targetMonth, 10) - 1;
            const monthEnum = monthNamesEnum[monthIndex];

            if (monthEnum) {
                const totals = await totalsReportsRepository.findOne({
                    where: {
                        congregation: { id: publisher.congregation.id },
                        month: monthEnum,
                        year: targetYear
                    }
                });

                if (totals) {
                    throw new BadRequestError(
                        `O relatório de ${startOfTargetMonth.format("MM/YYYY")} já foi fechado pelo secretário da congregação. Para qualquer alteração, fale diretamente com o secretário.`
                    );
                }
            }
        }
    }

    /* =========================================================
     *  ESTUDANTES BÍBLICOS
     * ========================================================= */

    // Listar estudantes do publicador
    async getStudents(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);

        const students = await publisherBibleStudentRepository.find({
            where: { publisher_id: publisher.id },
            order: { name: "ASC" }
        });

        return res.json(students);
    }

    // Criar estudante
    async createStudent(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { name } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            throw new BadRequestError("Nome do estudante é obrigatório");
        }

        const student = publisherBibleStudentRepository.create({
            publisher_id: publisher.id,
            name: name.trim(),
            active: true
        });

        await publisherBibleStudentRepository.save(student);
        return res.status(201).json(student);
    }

    // Atualizar estudante (nome / ativo)
    async updateStudent(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { student_id } = req.params;
        const { name, active } = req.body;

        const student = await publisherBibleStudentRepository.findOne({
            where: { id: student_id, publisher_id: publisher.id }
        });

        if (!student) throw new NotFoundError("Estudante não encontrado");

        if (name !== undefined) {
            if (!name || typeof name !== "string" || !name.trim()) {
                throw new BadRequestError("Nome inválido");
            }
            student.name = name.trim();
        }

        if (active !== undefined) {
            student.active = Boolean(active);
        }

        await publisherBibleStudentRepository.save(student);
        return res.json(student);
    }

    // Excluir estudante
    async deleteStudent(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { student_id } = req.params;

        const student = await publisherBibleStudentRepository.findOne({
            where: { id: student_id, publisher_id: publisher.id }
        });

        if (!student) throw new NotFoundError("Estudante não encontrado");

        await publisherBibleStudentRepository.remove(student);
        return res.status(204).send();
    }

    /* =========================================================
     *  ATIVIDADES DIÁRIAS (MINISTÉRIO)
     * ========================================================= */

    // Obter mês atual e atividades de um determinado mês (YYYY-MM)
    async getMonthActivities(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { year, month } = req.query; // Ex: year=2026, month=11 ou month=11/2026

        const targetYear = String(year || dayjs().format("YYYY"));
        const targetMonth = String(month || dayjs().format("MM")).padStart(2, "0");

        const startOfMonth = `${targetYear}-${targetMonth}-01`;
        const endOfMonth = dayjs(startOfMonth).endOf("month").format("YYYY-MM-DD");

        const activities = await publisherFieldActivityRepository.find({
            where: {
                publisher_id: publisher.id,
                date: Between(startOfMonth, endOfMonth)
            },
            relations: ["bibleStudent"],
            order: { date: "ASC", created_at: "ASC" }
        });

        // Buscar saldo de minutos do mês
        let monthBalance = await publisherMonthBalanceRepository.findOne({
            where: {
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth
            }
        });

        // Se não tiver saldo desse mês, busca se o mês anterior enviou saldo para este
        if (!monthBalance) {
            const prevDate = dayjs(startOfMonth).subtract(1, "month");
            const prevMonth = prevDate.format("MM");
            const prevYear = prevDate.format("YYYY");

            const prevBalance = await publisherMonthBalanceRepository.findOne({
                where: {
                    publisher_id: publisher.id,
                    year: prevYear,
                    month: prevMonth
                }
            });

            monthBalance = publisherMonthBalanceRepository.create({
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth,
                transferred_minutes_in: prevBalance?.transferred_minutes_out || 0,
                transferred_minutes_out: 0,
                is_closed: false
            });
        }

        // Buscar todos os estudantes cadastrados pelo publicador
        const publisherStudents = await publisherBibleStudentRepository.find({
            where: { publisher_id: publisher.id }
        });
        const studentsMap = new Map(publisherStudents.map(s => [s.id, s]));

        // Resumo
        let totalMinistryMinutes = 0;
        let totalCreditMinutes = 0;
        const studentsSet = new Set<string>();

        activities.forEach(act => {
            totalMinistryMinutes += Number(act.minutes || 0);
            totalCreditMinutes += Number(act.credit_minutes || 0);

            const ids: string[] = [];
            if (act.bible_student_ids && Array.isArray(act.bible_student_ids)) {
                ids.push(...act.bible_student_ids);
            } else if (typeof (act as any).bible_student_ids === "string" && (act as any).bible_student_ids.trim()) {
                ids.push(...(act as any).bible_student_ids.split(","));
            } else if (act.bible_student_id) {
                ids.push(act.bible_student_id);
            }

            const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
            act.bible_student_ids = uniqueIds;
            act.bibleStudents = uniqueIds.map(id => studentsMap.get(id)).filter(Boolean) as any[];

            if (!act.bibleStudent && act.bibleStudents.length > 0) {
                act.bibleStudent = act.bibleStudents[0];
            }

            uniqueIds.forEach(id => studentsSet.add(id));
        });

        const studentsWithStudies = Array.from(studentsSet)
            .map(id => studentsMap.get(id))
            .filter(Boolean)
            .map(s => ({ id: s!.id, name: s!.name }));

        const startOfTargetMonth = dayjs(`${targetYear}-${targetMonth}-01`);
        const deadline = startOfTargetMonth.add(1, "month").date(20).endOf("day");
        const isExpired = dayjs().isAfter(deadline);

        let isClosedBySecretary = false;
        const monthNamesEnum = [
            Months.JANEIRO, Months.FEVEREIRO, Months.MARCO, Months.ABRIL,
            Months.MAIO, Months.JUNHO, Months.JULHO, Months.AGOSTO,
            Months.SETEMBRO, Months.OUTUBRO, Months.NOVEMBRO, Months.DEZEMBRO
        ];
        const monthIndex = parseInt(targetMonth, 10) - 1;
        const monthEnum = monthNamesEnum[monthIndex];

        if (publisher.congregation?.id && monthEnum) {
            const totals = await totalsReportsRepository.findOne({
                where: {
                    congregation: { id: publisher.congregation.id },
                    month: monthEnum,
                    year: targetYear
                }
            });
            isClosedBySecretary = Boolean(totals);
        }

        let officialReport = null;
        if (monthEnum) {
            officialReport = await reportRepository.findOne({
                where: {
                    publisher: { id: publisher.id },
                    month: monthEnum,
                    year: targetYear
                }
            });
        }

        const isLocked = isClosedBySecretary || isExpired;
        const isMyReportSubmitted = Boolean(monthBalance?.is_closed || officialReport);
        const lockReason = isClosedBySecretary ? "closed_by_secretary" : isExpired ? "expired" : null;

        return res.json({
            year: targetYear,
            month: targetMonth,
            activities,
            balance: monthBalance,
            studentsWithStudies,
            isLocked,
            isClosedBySecretary,
            isExpired,
            isMyReportSubmitted,
            submittedReport: officialReport ? {
                id: officialReport.id,
                hours: officialReport.hours,
                studies: officialReport.studies,
                observations: officialReport.observations
            } : null,
            lockReason,
            deadlineDate: deadline.format("YYYY-MM-DD"),
            summary: {
                transferredMinutesIn: monthBalance.transferred_minutes_in || 0,
                totalMinistryMinutes,
                totalCreditMinutes,
                totalMinutesOverall: totalMinistryMinutes + totalCreditMinutes + (monthBalance.transferred_minutes_in || 0),
                totalStudiesCount: studentsSet.size
            }
        });
    }

    // Criar uma nova atividade diária
    async createActivity(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id, bible_student_ids } = req.body;

        if (!date) throw new BadRequestError("A data da atividade é obrigatória");

        const parsedDate = dayjs(date).format("YYYY-MM-DD");
        const actYear = dayjs(parsedDate).format("YYYY");
        const actMonth = dayjs(parsedDate).format("MM");

        await DailyMinistryController.assertMonthNotLocked(publisher, actYear, actMonth);

        const actMinutes = Math.max(0, parseInt(minutes, 10) || 0);
        const credMinutes = Math.max(0, parseInt(credit_minutes, 10) || 0);

        let studentIds: string[] = [];
        if (Array.isArray(bible_student_ids)) {
            studentIds = bible_student_ids.filter((id: any) => typeof id === "string" && id.trim().length > 0);
        } else if (bible_student_id) {
            studentIds = [bible_student_id];
        }

        if (actMinutes === 0 && credMinutes === 0 && studentIds.length === 0) {
            throw new BadRequestError("Informe o tempo de campo, crédito ou pelo menos um estudo realizado");
        }

        const activity = publisherFieldActivityRepository.create({
            publisher_id: publisher.id,
            date: parsedDate,
            minutes: actMinutes,
            credit_minutes: credMinutes,
            credit_description: credit_description?.trim() || null,
            notes: notes?.trim() || null,
            bible_student_id: studentIds.length > 0 ? studentIds[0] : null,
            bible_student_ids: studentIds
        });

        await publisherFieldActivityRepository.save(activity);
        return res.status(201).json(activity);
    }

    // Atualizar uma atividade
    async updateActivity(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { activity_id } = req.params;
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id, bible_student_ids } = req.body;

        const activity = await publisherFieldActivityRepository.findOne({
            where: { id: activity_id, publisher_id: publisher.id }
        });

        if (!activity) throw new NotFoundError("Atividade não encontrada");

        const oldYear = dayjs(activity.date).format("YYYY");
        const oldMonth = dayjs(activity.date).format("MM");
        await DailyMinistryController.assertMonthNotLocked(publisher, oldYear, oldMonth);

        if (date !== undefined) {
            const newYear = dayjs(date).format("YYYY");
            const newMonth = dayjs(date).format("MM");
            if (newYear !== oldYear || newMonth !== oldMonth) {
                await DailyMinistryController.assertMonthNotLocked(publisher, newYear, newMonth);
            }
            activity.date = dayjs(date).format("YYYY-MM-DD");
        }

        if (minutes !== undefined) activity.minutes = Math.max(0, parseInt(minutes, 10) || 0);
        if (credit_minutes !== undefined) activity.credit_minutes = Math.max(0, parseInt(credit_minutes, 10) || 0);
        if (credit_description !== undefined) activity.credit_description = credit_description?.trim() || null;
        if (notes !== undefined) activity.notes = notes?.trim() || null;

        if (bible_student_ids !== undefined) {
            const studentIds = Array.isArray(bible_student_ids)
                ? bible_student_ids.filter((id: any) => typeof id === "string" && id.trim().length > 0)
                : [];
            activity.bible_student_ids = studentIds;
            activity.bible_student_id = studentIds.length > 0 ? studentIds[0] : null;
        } else if (bible_student_id !== undefined) {
            if (bible_student_id) {
                activity.bible_student_id = bible_student_id;
                activity.bible_student_ids = [bible_student_id];
            } else {
                activity.bible_student_id = null;
                activity.bible_student_ids = [];
            }
        }

        await publisherFieldActivityRepository.save(activity);
        return res.json(activity);
    }

    // Excluir atividade
    async deleteActivity(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { activity_id } = req.params;

        const activity = await publisherFieldActivityRepository.findOne({
            where: { id: activity_id, publisher_id: publisher.id }
        });

        if (!activity) throw new NotFoundError("Atividade não encontrada");

        const actYear = dayjs(activity.date).format("YYYY");
        const actMonth = dayjs(activity.date).format("MM");
        await DailyMinistryController.assertMonthNotLocked(publisher, actYear, actMonth);

        await publisherFieldActivityRepository.remove(activity);
        return res.status(204).send();
    }

    /* =========================================================
     *  FECHAMENTO E ENVIO DO RELATÓRIO MENSAL
     * ========================================================= */

    // Submeter relatório final do mês
    async submitMonthReport(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const {
            year,
            month, // '01' a '12' ou nome
            hours, // horas finais calculadas / informadas
            studies, // quantidade de estudos final escolhida pelo usuário
            observations, // observações (crédito de horas etc)
            minutesHandling, // 'transfer' | 'round_up' | 'round_down'
            leftoverMinutes // minutos que sobraram
        } = req.body;

        if (!year || !month) throw new BadRequestError("Ano e mês são obrigatórios");

        const targetYear = String(year);
        const targetMonth = String(month).padStart(2, "0");

        await DailyMinistryController.assertMonthNotLocked(publisher, targetYear, targetMonth);

        // Obter nome do enum Months para salvar na tabela Report
        const monthIndex = parseInt(targetMonth, 10) - 1;
        const monthNamesEnum = [
            Months.JANEIRO, Months.FEVEREIRO, Months.MARCO, Months.ABRIL,
            Months.MAIO, Months.JUNHO, Months.JULHO, Months.AGOSTO,
            Months.SETEMBRO, Months.OUTUBRO, Months.NOVEMBRO, Months.DEZEMBRO
        ];
        const monthEnum = monthNamesEnum[monthIndex] || Months.JANEIRO;

        // 1. Atualizar ou criar o PublisherMonthBalance
        let balance = await publisherMonthBalanceRepository.findOne({
            where: {
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth
            }
        });

        if (!balance) {
            balance = publisherMonthBalanceRepository.create({
                publisher_id: publisher.id,
                year: targetYear,
                month: targetMonth
            });
        }

        const remaining = Math.max(0, parseInt(leftoverMinutes, 10) || 0);

        if (minutesHandling === "transfer") {
            balance.transferred_minutes_out = remaining;

            // Já atualiza ou cria o saldo inicial do mês seguinte!
            const nextDate = dayjs(`${targetYear}-${targetMonth}-01`).add(1, "month");
            const nextYear = nextDate.format("YYYY");
            const nextMonth = nextDate.format("MM");

            let nextBalance = await publisherMonthBalanceRepository.findOne({
                where: {
                    publisher_id: publisher.id,
                    year: nextYear,
                    month: nextMonth
                }
            });

            if (!nextBalance) {
                nextBalance = publisherMonthBalanceRepository.create({
                    publisher_id: publisher.id,
                    year: nextYear,
                    month: nextMonth,
                    transferred_minutes_in: remaining,
                    transferred_minutes_out: 0,
                    is_closed: false
                });
            } else {
                nextBalance.transferred_minutes_in = remaining;
            }

            await publisherMonthBalanceRepository.save(nextBalance);
        } else {
            balance.transferred_minutes_out = 0;
        }

        balance.is_closed = true;
        await publisherMonthBalanceRepository.save(balance);

        // 2. Salvar na tabela oficial Report da congregação
        let report = await reportRepository.findOne({
            where: {
                publisher: { id: publisher.id },
                month: monthEnum,
                year: targetYear
            }
        });

        const finalHours = Math.max(0, parseInt(hours, 10) || 0);
        const finalStudies = studies !== undefined && studies !== null && studies !== ""
            ? Math.max(0, parseInt(studies, 10) || 0)
            : 0;

        if (!report) {
            report = new Report();
            report.publisher = publisher;
            report.month = monthEnum;
            report.year = targetYear;
            report.hours = finalHours;
            report.studies = finalStudies;
            report.observations = observations?.trim() || "";
            report.group = publisher.group?.name || "";
            report.privileges = publisher.privileges || [];
        } else {
            report.hours = finalHours;
            report.studies = finalStudies;
            report.observations = observations?.trim() || "";
            if (publisher.group?.name) report.group = publisher.group.name;
        }

        await reportRepository.save(report);

        return res.json({
            message: "Relatório enviado com sucesso!",
            report,
            balance
        });
    }
}
