import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import { MechanicalAssignment } from "../../entities/MechanicalAssignment";
import { MechanicalSchedule } from "../../entities/MechanicalSchedule";
import { Gender, Situation } from "../../entities/Publisher";
import { convertMeetingDayPortugueseToIso } from "../../functions/cleaningFunctions";
import { congregationRepository } from "../../repositories/congregationRepository";
import { mechanicalAssignmentRepository } from "../../repositories/mechanicalAssignmentRepository";
import { mechanicalScheduleRepository } from "../../repositories/mechanicalScheduleRepository";
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository";
import { publisherRepository } from "../../repositories/publisherRepository";
import { MechanicalMeetingType, MechanicalRole } from "../../types/mechanical";
import { MechanicalScheduleService } from "./MechanicalScheduleService";

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export class MechanicalAutoAssignService {
    private scheduleService: MechanicalScheduleService;

    constructor() {
        this.scheduleService = new MechanicalScheduleService();
    }

    async autoAssignMonth(
        congregationId: string,
        year: number,
        month: number,
        options: { forceReassignManual?: boolean } = { forceReassignManual: false }
    ): Promise<MechanicalSchedule[]> {
        const congregation = await congregationRepository.findOne({
            where: { id: congregationId }
        });

        if (!congregation) {
            throw new Error("Congregação não encontrada.");
        }

        const config = await this.scheduleService.getConfig(congregationId);

        // Dias da semana das reuniões da congregação
        const midweekDay = congregation.dayMeetingLifeAndMinistary
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingLifeAndMinistary)
            : 3; // Quarta-feira por padrão

        const endweekDay = congregation.dayMeetingPublic
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingPublic)
            : 7; // Domingo por padrão

        // Intervalo do mês em semanas (Segunda a Domingo)
        const startOfMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
        const endOfMonth = startOfMonth.endOf("month");

        const firstMonday = startOfMonth.startOf("isoWeek");
        const lastSunday = endOfMonth.endOf("isoWeek");

        // Publicadores ativos varões da congregação com privilégios e ausências
        const publishers = await publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Situation.Ativo,
                gender: Gender.Masculino
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege", "unavailabilities"]
        });

        // 1. Carrega histórico prévio para inicializar o algoritmo LRU & Mesclagem
        const previousAssignments = await mechanicalAssignmentRepository
            .createQueryBuilder("assign")
            .innerJoinAndSelect("assign.schedule", "sched")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.date < :startDate", { startDate: firstMonday.format("YYYY-MM-DD") })
            .andWhere("assign.publisher_id IS NOT NULL")
            .orderBy("sched.date", "DESC")
            .getMany();

        const lastAnyDateMap = new Map<string, string>();
        const lastAnyRoleMap = new Map<string, MechanicalRole>();
        const lastThisRoleDateMap = new Map<string, string>();

        for (const pa of previousAssignments) {
            if (!pa.publisher_id) continue;
            const dt = pa.schedule.date;

            if (!lastAnyDateMap.has(pa.publisher_id)) {
                lastAnyDateMap.set(pa.publisher_id, dt);
                lastAnyRoleMap.set(pa.publisher_id, pa.role);
            }

            const key = `${pa.publisher_id}:${pa.role}`;
            if (!lastThisRoleDateMap.has(key)) {
                lastThisRoleDateMap.set(key, dt);
            }
        }

        const resultSchedules: MechanicalSchedule[] = [];
        let currentWeekMonday = firstMonday.clone();

        while (currentWeekMonday.isBefore(lastSunday)) {
            const weekStartDate = currentWeekMonday.format("YYYY-MM-DD");

            // Datas exatas das duas reuniões dessa semana
            const midweekMeetingDate = currentWeekMonday.isoWeekday(midweekDay).format("YYYY-MM-DD");
            const weekendMeetingDate = currentWeekMonday.isoWeekday(endweekDay).format("YYYY-MM-DD");

            // ⚠️ REGRA DO PRESIDENTE DO MEIO DE SEMANA:
            // Busca o presidente do meio de semana para esta semana
            const midweekSchedule = await midweekScheduleRepository.findOne({
                where: {
                    congregation_id: congregationId,
                    weekDate: weekStartDate
                }
            });
            const midweekChairmanId = midweekSchedule?.chairman_id || null;

            // Reuniões a planejar na semana
            const meetingsToPlan = [
                {
                    date: midweekMeetingDate,
                    meetingType: MechanicalMeetingType.MIDWEEK,
                    attendantsCount: config.midweekAttendantsCount,
                    soundCount: config.midweekSoundCount,
                    mediaCount: config.midweekMediaCount,
                    rovingMicsCount: config.midweekRovingMicsCount,
                    stageMicsCount: config.midweekStageMicsCount
                },
                {
                    date: weekendMeetingDate,
                    meetingType: MechanicalMeetingType.WEEKEND,
                    attendantsCount: config.weekendAttendantsCount,
                    soundCount: config.weekendSoundCount,
                    mediaCount: config.weekendMediaCount,
                    rovingMicsCount: config.weekendRovingMicsCount,
                    stageMicsCount: config.weekendStageMicsCount
                }
            ];

            let midweekPlannedAssignments: MechanicalAssignment[] = [];

            for (const meetingInfo of meetingsToPlan) {
                let schedule = await mechanicalScheduleRepository.findOne({
                    where: {
                        congregation_id: congregationId,
                        date: meetingInfo.date
                    },
                    relations: ["assignments", "assignments.publisher"]
                });

                if (!schedule) {
                    schedule = mechanicalScheduleRepository.create({
                        congregation_id: congregationId,
                        weekStartDate,
                        date: meetingInfo.date,
                        meetingType: meetingInfo.meetingType,
                        assignments: []
                    });
                    schedule = await mechanicalScheduleRepository.save(schedule);
                }

                // Cria lista de slots esperados para esta reunião
                const expectedSlots: { role: MechanicalRole; order: number }[] = [];

                // Indicadores
                for (let i = 1; i <= meetingInfo.attendantsCount; i++) {
                    expectedSlots.push({ role: MechanicalRole.ATTENDANT, order: i });
                }

                // Som e Mídias (combinados ou separados)
                if (config.combineSoundAndMedia) {
                    expectedSlots.push({ role: MechanicalRole.SOUND_AND_MEDIA, order: 1 });
                } else {
                    for (let i = 1; i <= meetingInfo.soundCount; i++) {
                        expectedSlots.push({ role: MechanicalRole.SOUND, order: i });
                    }
                    for (let i = 1; i <= meetingInfo.mediaCount; i++) {
                        expectedSlots.push({ role: MechanicalRole.MEDIA, order: i });
                    }
                }

                // Volantes
                for (let i = 1; i <= meetingInfo.rovingMicsCount; i++) {
                    expectedSlots.push({ role: MechanicalRole.ROVING_MIC, order: i });
                }

                // Pedestal
                for (let i = 1; i <= meetingInfo.stageMicsCount; i++) {
                    expectedSlots.push({ role: MechanicalRole.STAGE_MIC, order: i });
                }

                const assignedThisMeeting = new Set<string>();

                // Carrega ou inicializa os assignments
                const currentAssignments: MechanicalAssignment[] = schedule.assignments || [];
                const updatedAssignments: MechanicalAssignment[] = [];

                // 1. Preserva designações manuais se forceReassignManual for false (apenas se NÃO for fim de semana com equipe única)
                for (const slot of expectedSlots) {
                    const existing = currentAssignments.find(
                        (a: MechanicalAssignment) => a.role === slot.role && a.order === slot.order
                    );

                    if (existing && existing.publisher_id && (!options.forceReassignManual && existing.isManual)) {
                        // Se a congregação usa o mesmo grupo a semana toda e estamos no fim de semana,
                        // NUNCA preserva designações antigas do fim de semana para espelhar estritamente a equipe da semana
                        if (config.sameTeamWholeWeek && meetingInfo.meetingType === MechanicalMeetingType.WEEKEND) {
                            continue;
                        }

                        assignedThisMeeting.add(existing.publisher_id);
                        updatedAssignments.push(existing);

                        // Atualiza histórico em memória
                        lastAnyDateMap.set(existing.publisher_id, meetingInfo.date);
                        lastAnyRoleMap.set(existing.publisher_id, existing.role);
                        lastThisRoleDateMap.set(`${existing.publisher_id}:${existing.role}`, meetingInfo.date);
                    }
                }

                // 2. Se for fim de semana e a congregação usa a mesma equipe a semana toda:
                // Copia DIRETAMENTE e INTEGRALMENTE a equipe definida para o meio de semana
                if (config.sameTeamWholeWeek && meetingInfo.meetingType === MechanicalMeetingType.WEEKEND) {
                    for (const slot of expectedSlots) {
                        const matchingMidweek = midweekPlannedAssignments.find(
                            ma => ma.role === slot.role && ma.order === slot.order
                        );

                        const targetPublisherId = matchingMidweek ? matchingMidweek.publisher_id : null;
                        const targetIsManual = matchingMidweek ? matchingMidweek.isManual : false;

                        let chosenAssignment = currentAssignments.find(
                            (a: MechanicalAssignment) => a.role === slot.role && a.order === slot.order
                        );

                        const matchingPublisher = targetPublisherId ? (publishers.find(p => p.id === targetPublisherId) || null) : null;

                        if (!chosenAssignment) {
                            chosenAssignment = mechanicalAssignmentRepository.create({
                                schedule_id: schedule.id,
                                role: slot.role,
                                order: slot.order,
                                publisher_id: targetPublisherId,
                                publisher: matchingPublisher,
                                isManual: targetIsManual
                            });
                        } else {
                            chosenAssignment.publisher_id = targetPublisherId;
                            chosenAssignment.publisher = matchingPublisher;
                            chosenAssignment.isManual = targetIsManual;
                        }

                        await mechanicalAssignmentRepository.save(chosenAssignment);
                        if (targetPublisherId) {
                            assignedThisMeeting.add(targetPublisherId);
                            lastAnyDateMap.set(targetPublisherId, meetingInfo.date);
                            lastAnyRoleMap.set(targetPublisherId, slot.role);
                            lastThisRoleDateMap.set(`${targetPublisherId}:${slot.role}`, meetingInfo.date);
                        }
                        updatedAssignments.push(chosenAssignment);
                    }
                } else {
                    // 3. Preenche os slots restantes com o Algoritmo Inteligente (LRU + Diversificação)
                    const meetingDateObj = dayjs(meetingInfo.date);

                    for (const slot of expectedSlots) {
                        const alreadyAssigned = updatedAssignments.some(
                            a => a.role === slot.role && a.order === slot.order
                        );
                        if (alreadyAssigned) continue;

                    // Busca candidatos elegíveis
                    const eligiblePublishers = publishers.filter(pub => {
                        // ❌ RESTRIÇÃO ESTRITA: Presidente do Meio de Semana NUNCA é colocado no auto-preenchimento
                        if (midweekChairmanId && pub.id === midweekChairmanId) {
                            return false;
                        }

                        // ❌ Não pode 2 funções na mesma reunião
                        if (assignedThisMeeting.has(pub.id)) {
                            return false;
                        }

                        // ❌ Indisponibilidade / Ausência
                        if (pub.unavailabilities?.length) {
                            const isUnavailable = pub.unavailabilities.some(unav => {
                                const start = dayjs(unav.startDate);
                                const end = dayjs(unav.endDate);
                                return (
                                    (meetingDateObj.isAfter(start, "day") || meetingDateObj.isSame(start, "day")) &&
                                    (meetingDateObj.isBefore(end, "day") || meetingDateObj.isSame(end, "day"))
                                );
                            });
                            if (isUnavailable) return false;
                        }

                        return true;
                    });

                    // Filtra por qualificação com fallback se ninguém tiver o privilégio explícito
                    let qualifiedPublishers = eligiblePublishers.filter(pub =>
                        this.scheduleService.isPublisherQualifiedForRole(pub, slot.role)
                    );

                    if (qualifiedPublishers.length === 0) {
                        qualifiedPublishers = eligiblePublishers;
                    }

                    // Pontua e ordena os candidatos (LRU + Mesclagem de Funções)
                    const scoredCandidates = qualifiedPublishers.map(pub => {
                        const lastAnyDate = lastAnyDateMap.get(pub.id) || null;
                        const daysSinceLastAny = lastAnyDate
                            ? meetingDateObj.diff(dayjs(lastAnyDate), "day")
                            : null;

                        const lastRole = lastAnyRoleMap.get(pub.id) || null;

                        const roleKey = `${pub.id}:${slot.role}`;
                        const lastThisRoleDate = lastThisRoleDateMap.get(roleKey) || null;
                        const daysSinceLastThisRole = lastThisRoleDate
                            ? meetingDateObj.diff(dayjs(lastThisRoleDate), "day")
                            : null;

                        let score = 1000;

                        // 🎯 CRITÉRIO 1: Mais antigos primeiro (LRU - tempo sem designação mecânica)
                        if (daysSinceLastAny === null) {
                            score += 10000; // Prioridade máxima para quem nunca fez
                        } else {
                            score += daysSinceLastAny * 30;
                        }

                        // 🎯 CRITÉRIO 2: Mesclando, para o mesmo irmão não fazer a mesma coisa sempre
                        if (lastRole === slot.role) {
                            // Penalidade severa se a última função dele foi a mesma
                            score -= 6000;
                        } else if (lastRole !== null) {
                            // Bônus de rotação/diversificação de papéis
                            score += 3000;
                        }

                        // Preferência por quem está há mais tempo sem fazer esta função específica
                        if (daysSinceLastThisRole === null) {
                            score += 1500;
                        } else {
                            score += daysSinceLastThisRole * 10;
                        }

                        return { pub, score };
                    });

                    scoredCandidates.sort((a, b) => b.score - a.score);

                    let chosenAssignment = currentAssignments.find(
                        (a: MechanicalAssignment) => a.role === slot.role && a.order === slot.order
                    );

                    if (!chosenAssignment) {
                        chosenAssignment = mechanicalAssignmentRepository.create({
                            schedule_id: schedule.id,
                            role: slot.role,
                            order: slot.order,
                            publisher_id: null,
                            isManual: false
                        });
                    }

                    if (scoredCandidates.length > 0) {
                        const chosen = scoredCandidates[0].pub;
                        chosenAssignment.publisher_id = chosen.id;
                        chosenAssignment.publisher = chosen;
                        chosenAssignment.isManual = false;
                        assignedThisMeeting.add(chosen.id);

                        // Atualiza estado em memória
                        lastAnyDateMap.set(chosen.id, meetingInfo.date);
                        lastAnyRoleMap.set(chosen.id, slot.role);
                        lastThisRoleDateMap.set(`${chosen.id}:${slot.role}`, meetingInfo.date);
                    } else {
                        chosenAssignment.publisher_id = null;
                        chosenAssignment.publisher = null;
                    }

                    await mechanicalAssignmentRepository.save(chosenAssignment);
                    updatedAssignments.push(chosenAssignment);
                }
                }

                if (meetingInfo.meetingType === MechanicalMeetingType.MIDWEEK) {
                    midweekPlannedAssignments = [...updatedAssignments];
                }

                // Remove slots antigos não mais necessários (ex: se reduziu quantidade)
                for (const oldAssign of currentAssignments) {
                    const isStillNeeded = expectedSlots.some(
                        s => s.role === oldAssign.role && s.order === oldAssign.order
                    );
                    if (!isStillNeeded) {
                        await mechanicalAssignmentRepository.delete(oldAssign.id);
                    }
                }

                const savedSchedule = await mechanicalScheduleRepository
                    .createQueryBuilder("sched")
                    .leftJoinAndSelect("sched.assignments", "assignments")
                    .leftJoinAndSelect("assignments.publisher", "publisher")
                    .where("sched.id = :id", { id: schedule.id })
                    .orderBy("assignments.order", "ASC")
                    .getOne();

                if (savedSchedule) {
                    resultSchedules.push(savedSchedule);
                }
            }

            currentWeekMonday = currentWeekMonday.add(1, "week");
        }

        return resultSchedules;
    }
}

