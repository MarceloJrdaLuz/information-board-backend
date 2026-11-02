import { Request, Response } from "express";
import { decoder } from "../../middlewares/permissions";
import { userRepository } from "../../repositories/userRepository";
import { publisherFieldActivityRepository } from "../../repositories/publisherFieldActivityRepository";
import { publisherBibleStudentRepository } from "../../repositories/publisherBibleStudentRepository";
import { publisherMonthBalanceRepository } from "../../repositories/publisherMonthBalanceRepository";
import { reportRepository } from "../../repositories/reportRepository";
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

        // Resumo
        let totalMinistryMinutes = 0;
        let totalCreditMinutes = 0;
        const studentsSet = new Set<string>();

        activities.forEach(act => {
            totalMinistryMinutes += Number(act.minutes || 0);
            totalCreditMinutes += Number(act.credit_minutes || 0);
            if (act.bible_student_id) {
                studentsSet.add(act.bible_student_id);
            }
        });

        return res.json({
            year: targetYear,
            month: targetMonth,
            activities,
            balance: monthBalance,
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
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id } = req.body;

        if (!date) throw new BadRequestError("A data da atividade é obrigatória");

        const parsedDate = dayjs(date).format("YYYY-MM-DD");
        const actMinutes = Math.max(0, parseInt(minutes, 10) || 0);
        const credMinutes = Math.max(0, parseInt(credit_minutes, 10) || 0);

        if (actMinutes === 0 && credMinutes === 0 && !bible_student_id) {
            throw new BadRequestError("Informe o tempo de campo, crédito ou um estudo realizado");
        }

        // Valida se o estudante pertence ao publicador caso informado
        if (bible_student_id) {
            const student = await publisherBibleStudentRepository.findOne({
                where: { id: bible_student_id, publisher_id: publisher.id }
            });
            if (!student) throw new BadRequestError("Estudante não encontrado");
        }

        const activity = publisherFieldActivityRepository.create({
            publisher_id: publisher.id,
            date: parsedDate,
            minutes: actMinutes,
            credit_minutes: credMinutes,
            credit_description: credit_description?.trim() || null,
            notes: notes?.trim() || null,
            bible_student_id: bible_student_id || null
        });

        await publisherFieldActivityRepository.save(activity);
        return res.status(201).json(activity);
    }

    // Atualizar uma atividade
    async updateActivity(req: Request, res: Response) {
        const publisher = await DailyMinistryController.getLoggedPublisher(req);
        const { activity_id } = req.params;
        const { date, minutes, credit_minutes, credit_description, notes, bible_student_id } = req.body;

        const activity = await publisherFieldActivityRepository.findOne({
            where: { id: activity_id, publisher_id: publisher.id }
        });

        if (!activity) throw new NotFoundError("Atividade não encontrada");

        if (date !== undefined) activity.date = dayjs(date).format("YYYY-MM-DD");
        if (minutes !== undefined) activity.minutes = Math.max(0, parseInt(minutes, 10) || 0);
        if (credit_minutes !== undefined) activity.credit_minutes = Math.max(0, parseInt(credit_minutes, 10) || 0);
        if (credit_description !== undefined) activity.credit_description = credit_description?.trim() || null;
        if (notes !== undefined) activity.notes = notes?.trim() || null;

        if (bible_student_id !== undefined) {
            if (bible_student_id) {
                const student = await publisherBibleStudentRepository.findOne({
                    where: { id: bible_student_id, publisher_id: publisher.id }
                });
                if (!student) throw new BadRequestError("Estudante não encontrado");
                activity.bible_student_id = student.id;
            } else {
                activity.bible_student_id = null;
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
