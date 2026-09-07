import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { MechanicalSchedule } from "../../entities/MechanicalSchedule";
import { MechanicalScheduleConfig } from "../../entities/MechanicalScheduleConfig";
import { MidweekSpecialType } from "../../entities/midweekEnums";
import { Gender, Publisher, Situation } from "../../entities/Publisher";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { convertMeetingDayPortugueseToIso } from "../../functions/cleaningFunctions";
import { congregationRepository } from "../../repositories/congregationRepository";
import { mechanicalAssignmentRepository } from "../../repositories/mechanicalAssignmentRepository";
import { mechanicalScheduleConfigRepository } from "../../repositories/mechanicalScheduleConfigRepository";
import { mechanicalScheduleRepository } from "../../repositories/mechanicalScheduleRepository";
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository";
import { privilegeRepository } from "../../repositories/privilegeRepository";
import { publisherPrivilegeRepository } from "../../repositories/publisherPrivilegeRepository";
import { publisherRepository } from "../../repositories/publisherRepository";
import { MechanicalMeetingType, MechanicalRole as RoleEnum } from "../../types/mechanical";

dayjs.extend(isBetween);

export interface MechanicalCandidateSuggestion {
    id: string;
    fullName: string;
    nickname?: string | null;
    isQualified: boolean;
    isUnavailable: boolean;
    unavailabilityReason?: string | null;
    isMidweekChairman: boolean;
    isAssignedThisMeeting: boolean;
    daysSinceLastAny: number | null;
    daysSinceLastThisRole: number | null;
    lastRole: string | null;
    score: number;
}

export class MechanicalScheduleService {
    async getConfig(congregationId: string): Promise<MechanicalScheduleConfig> {
        let config = await mechanicalScheduleConfigRepository.findOne({
            where: { congregation_id: congregationId }
        });

        if (!config) {
            config = mechanicalScheduleConfigRepository.create({
                congregation_id: congregationId,
                combineSoundAndMedia: false,
                midweekAttendantsCount: 2,
                midweekSoundCount: 1,
                midweekMediaCount: 1,
                midweekRovingMicsCount: 2,
                midweekStageMicsCount: 1,
                weekendAttendantsCount: 2,
                weekendSoundCount: 1,
                weekendMediaCount: 1,
                weekendRovingMicsCount: 2,
                weekendStageMicsCount: 1
            });
            await mechanicalScheduleConfigRepository.save(config);
        }

        return config;
    }

    async saveConfig(
        congregationId: string,
        data: Partial<MechanicalScheduleConfig>
    ): Promise<MechanicalScheduleConfig> {
        const config = await this.getConfig(congregationId);

        Object.assign(config, data);
        return await mechanicalScheduleConfigRepository.save(config);
    }

    async getMonthSchedules(congregationId: string, year: number, month: number, monthsCount: number = 1) {
        const startOfMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
        const safeMonths = Math.min(Math.max(monthsCount, 1), 6);
        const endOfMonth = startOfMonth.add(safeMonths - 1, "month").endOf("month");

        // Semana começa na segunda-feira antes ou no primeiro dia do mês inicial
        const firstWeekMonday = startOfMonth.startOf("isoWeek").format("YYYY-MM-DD");
        const lastWeekSunday = endOfMonth.endOf("isoWeek").format("YYYY-MM-DD");

        const congregation = await congregationRepository.findOne({
            where: { id: congregationId }
        });

        const midweekDayOfWeek = congregation?.dayMeetingLifeAndMinistary
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingLifeAndMinistary)
            : 3;
        const weekendDayOfWeek = congregation?.dayMeetingPublic
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingPublic)
            : 7;

        // Garante que todas as semanas do período existam
        let curMonday = dayjs(firstWeekMonday);
        const endSun = dayjs(lastWeekSunday);
        const allWeekKeys: string[] = [];
        while (curMonday.isBefore(endSun)) {
            allWeekKeys.push(curMonday.format("YYYY-MM-DD"));
            curMonday = curMonday.add(1, "week");
        }

        const schedules = await mechanicalScheduleRepository
            .createQueryBuilder("sched")
            .leftJoinAndSelect("sched.assignments", "assignments")
            .leftJoinAndSelect("assignments.publisher", "publisher")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.weekStartDate IN (:...allWeekKeys)", { allWeekKeys })
            .orderBy("sched.date", "ASC")
            .addOrderBy("assignments.order", "ASC")
            .getMany();

        // Busca registros de MidweekSchedule no mesmo período para detectar eventos especiais
        const midweekSchedules = await midweekScheduleRepository
            .createQueryBuilder("mid")
            .where("mid.congregation_id = :congregationId", { congregationId })
            .andWhere("mid.weekDate IN (:...allWeekKeys)", { allWeekKeys })
            .getMany();

        // Agrupa por semana (weekStartDate) e reconcilia alterações de dias de reunião
        const weeksMap = new Map<string, MechanicalSchedule[]>();

        for (const weekStartDate of allWeekKeys) {
            const monday = dayjs(weekStartDate);
            const expectedMidweekDate = monday.isoWeekday(midweekDayOfWeek).format("YYYY-MM-DD");
            const expectedWeekendDate = monday.isoWeekday(weekendDayOfWeek).format("YYYY-MM-DD");

            const weekScheds = schedules.filter(s => s.weekStartDate === weekStartDate);

            // Reconcilia MIDWEEK
            const midweekList = weekScheds.filter(s => s.meetingType === MechanicalMeetingType.MIDWEEK);
            let validMidweek: MechanicalSchedule | null = null;
            if (midweekList.length > 0) {
                validMidweek = midweekList.find(s => s.date === expectedMidweekDate) || midweekList[0];
                if (validMidweek.date !== expectedMidweekDate) {
                    validMidweek.date = expectedMidweekDate;
                    await mechanicalScheduleRepository.save(validMidweek);
                }
                for (const extra of midweekList) {
                    if (extra.id !== validMidweek.id) {
                        await mechanicalScheduleRepository.delete(extra.id);
                    }
                }
            }

            // Reconcilia WEEKEND
            const weekendList = weekScheds.filter(s => s.meetingType === MechanicalMeetingType.WEEKEND);
            let validWeekend: MechanicalSchedule | null = null;
            if (weekendList.length > 0) {
                validWeekend = weekendList.find(s => s.date === expectedWeekendDate) || weekendList[0];
                if (validWeekend.date !== expectedWeekendDate) {
                    validWeekend.date = expectedWeekendDate;
                    await mechanicalScheduleRepository.save(validWeekend);
                }
                for (const extra of weekendList) {
                    if (extra.id !== validWeekend.id) {
                        await mechanicalScheduleRepository.delete(extra.id);
                    }
                }
            }

            // Remove outros órfãos
            for (const s of weekScheds) {
                if (
                    s.meetingType !== MechanicalMeetingType.MIDWEEK &&
                    s.meetingType !== MechanicalMeetingType.WEEKEND
                ) {
                    await mechanicalScheduleRepository.delete(s.id);
                }
            }

            const cleanWeekList: MechanicalSchedule[] = [];
            if (validMidweek) cleanWeekList.push(validMidweek);
            if (validWeekend) cleanWeekList.push(validWeekend);
            cleanWeekList.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

            weeksMap.set(weekStartDate, cleanWeekList);
        }

        const weeks = allWeekKeys.map((weekStartDate) => {
            const monday = dayjs(weekStartDate);
            const sunday = monday.add(6, "day");
            const weekSchedules = weeksMap.get(weekStartDate) || [];

            // Verifica se a semana foi explicitamente marcada nas partes mecânicas
            const hasExplicitSetting = weekSchedules.length > 0;
            const explicitNoMeeting = hasExplicitSetting && weekSchedules.every(s => s.hasNoMeeting);
            const explicitEventTitle = weekSchedules.find(s => s.eventTitle)?.eventTitle || null;

            // Verifica se há evento especial registrado no midweek
            const mid = midweekSchedules.find(m => m.weekDate === weekStartDate);
            const isMidweekSpecialNoMeeting = mid?.isSpecial === true &&
                mid?.specialType !== MidweekSpecialType.NONE &&
                mid?.specialType !== MidweekSpecialType.CIRCUIT_OVERSEER_VISIT;

            let fallbackEventTitle: string | null = null;
            if (isMidweekSpecialNoMeeting) {
                if (mid?.specialName && mid.specialName.trim()) {
                    fallbackEventTitle = mid.specialName.trim();
                } else if (mid?.specialType === MidweekSpecialType.CIRCUIT_ASSEMBLY) {
                    fallbackEventTitle = "Assembleia de Circuito";
                } else if (mid?.specialType === MidweekSpecialType.REGIONAL_CONVENTION) {
                    fallbackEventTitle = "Congresso Regional";
                } else if (mid?.specialType === MidweekSpecialType.MEMORIAL) {
                    fallbackEventTitle = "Celebração da Morte de Cristo";
                } else {
                    fallbackEventTitle = "Evento Especial";
                }
            }

            const isManuallyActivated = weekSchedules.some(s => s.notes === "MANUALLY_ACTIVATED");
            const isManuallyDeactivated = weekSchedules.some(s => s.hasNoMeeting);

            let hasNoMeeting = false;
            let eventTitle: string | null = null;

            if (isManuallyActivated) {
                hasNoMeeting = false;
                eventTitle = null;
            } else if (isManuallyDeactivated) {
                hasNoMeeting = true;
                eventTitle = explicitEventTitle || fallbackEventTitle || "Sem Reunião";
            } else if (isMidweekSpecialNoMeeting) {
                hasNoMeeting = true;
                eventTitle = fallbackEventTitle;
            } else {
                hasNoMeeting = false;
                eventTitle = null;
            }

            return {
                weekStartDate,
                weekEndDate: sunday.format("YYYY-MM-DD"),
                formattedWeek: `Semana de ${monday.format("DD/MM")} a ${sunday.format("DD/MM/YYYY")}`,
                hasNoMeeting,
                eventTitle,
                schedules: weekSchedules
            };
        });

        const allCleanSchedules: MechanicalSchedule[] = [];
        for (const weekList of weeksMap.values()) {
            allCleanSchedules.push(...weekList);
        }

        return {
            year,
            month,
            monthsCount: safeMonths,
            weeks,
            schedules: allCleanSchedules
        };
    }

    async toggleWeekMeeting(
        congregationId: string,
        weekStartDate: string,
        hasNoMeeting: boolean,
        eventTitle?: string | null
    ) {
        const monday = dayjs(weekStartDate);
        const congregation = await congregationRepository.findOne({ where: { id: congregationId } });
        if (!congregation) {
            throw new NotFoundError("Congregação não encontrada.");
        }

        const midweekDayOfWeek = congregation.dayMeetingLifeAndMinistary
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingLifeAndMinistary)
            : 3;
        const weekendDayOfWeek = congregation.dayMeetingPublic
            ? convertMeetingDayPortugueseToIso(congregation.dayMeetingPublic)
            : 7;

        const midweekDate = monday.isoWeekday(midweekDayOfWeek).format("YYYY-MM-DD");
        const weekendDate = monday.isoWeekday(weekendDayOfWeek).format("YYYY-MM-DD");

        const meetingInfos = [
            { date: midweekDate, type: MechanicalMeetingType.MIDWEEK },
            { date: weekendDate, type: MechanicalMeetingType.WEEKEND }
        ];

        const updatedSchedules: MechanicalSchedule[] = [];

        for (const info of meetingInfos) {
            const existingSchedules = await mechanicalScheduleRepository.find({
                where: {
                    congregation_id: congregationId,
                    weekStartDate,
                    meetingType: info.type
                },
                relations: ["assignments"]
            });

            let sched: MechanicalSchedule;
            const exactMatch = existingSchedules.find(s => s.date === info.date);

            if (exactMatch) {
                sched = exactMatch;
                for (const extra of existingSchedules) {
                    if (extra.id !== sched.id) {
                        await mechanicalScheduleRepository.delete(extra.id);
                    }
                }
            } else if (existingSchedules.length > 0) {
                sched = existingSchedules[0];
                sched.date = info.date;
                for (let i = 1; i < existingSchedules.length; i++) {
                    await mechanicalScheduleRepository.delete(existingSchedules[i].id);
                }
            } else {
                sched = mechanicalScheduleRepository.create({
                    congregation_id: congregationId,
                    weekStartDate,
                    date: info.date,
                    meetingType: info.type,
                    assignments: []
                });
            }

            sched.hasNoMeeting = hasNoMeeting;
            sched.eventTitle = hasNoMeeting ? (eventTitle || null) : null;
            sched.notes = !hasNoMeeting ? "MANUALLY_ACTIVATED" : null;

            // Se marcou como sem reunião, remove todas as atribuições
            if (hasNoMeeting && sched.id) {
                await mechanicalAssignmentRepository.delete({ schedule_id: sched.id });
                sched.assignments = [];
            }

            await mechanicalScheduleRepository.save(sched);
            updatedSchedules.push(sched);
        }

        // Limpa quaisquer escalas órfãs para a semana
        const allWeekSchedules = await mechanicalScheduleRepository.find({
            where: {
                congregation_id: congregationId,
                weekStartDate
            }
        });
        for (const s of allWeekSchedules) {
            if (s.date !== midweekDate && s.date !== weekendDate) {
                await mechanicalAssignmentRepository.delete({ schedule_id: s.id });
                await mechanicalScheduleRepository.delete(s.id);
            }
        }

        return {
            success: true,
            weekStartDate,
            hasNoMeeting,
            eventTitle: eventTitle || null,
            schedules: updatedSchedules
        };
    }

    async updateAssignment(assignmentId: string, publisherId: string | null) {
        const assignment = await mechanicalAssignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ["schedule", "publisher"]
        });

        if (!assignment) {
            throw new NotFoundError("Designação não encontrada.");
        }

        assignment.publisher_id = publisherId;
        assignment.isManual = true;

        await mechanicalAssignmentRepository.save(assignment);

        // Se a congregação usa a mesma equipe a semana toda, sincroniza com a reunião irmã da mesma semana
        const config = await this.getConfig(assignment.schedule.congregation_id);
        if (config.sameTeamWholeWeek) {
            const siblingSchedule = await mechanicalScheduleRepository.findOne({
                where: {
                    congregation_id: assignment.schedule.congregation_id,
                    weekStartDate: assignment.schedule.weekStartDate
                },
                relations: ["assignments"]
            });

            // Se encontrou reunião irmã na mesma semana (ex: fim de semana se alterou meio de semana, ou vice-versa)
            const otherSchedules = await mechanicalScheduleRepository.find({
                where: {
                    congregation_id: assignment.schedule.congregation_id,
                    weekStartDate: assignment.schedule.weekStartDate
                },
                relations: ["assignments"]
            });

            for (const sched of otherSchedules) {
                if (sched.id === assignment.schedule.id) continue;

                let siblingAssignment = sched.assignments?.find(
                    a => a.role === assignment.role && a.order === assignment.order
                );

                if (!siblingAssignment) {
                    siblingAssignment = mechanicalAssignmentRepository.create({
                        schedule_id: sched.id,
                        role: assignment.role,
                        order: assignment.order,
                        publisher_id: publisherId,
                        isManual: true
                    });
                } else {
                    siblingAssignment.publisher_id = publisherId;
                    siblingAssignment.isManual = true;
                }

                await mechanicalAssignmentRepository.save(siblingAssignment);
            }
        }

        return await mechanicalAssignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ["schedule", "publisher"]
        });
    }

    async getPublisherSuggestionsForRole(
        role: RoleEnum,
        scheduleId: string,
        congregationId: string
    ): Promise<MechanicalCandidateSuggestion[]> {
        const schedule = await mechanicalScheduleRepository.findOne({
            where: { id: scheduleId, congregation_id: congregationId },
            relations: ["assignments"]
        });

        if (!schedule) {
            throw new NotFoundError("Reunião não encontrada.");
        }

        const meetingDate = schedule.date;
        const targetDateObj = dayjs(meetingDate);

        // Busca o presidente do meio de semana da mesma semana
        const midweekSched = await midweekScheduleRepository.findOne({
            where: {
                congregation_id: congregationId,
                weekDate: schedule.weekStartDate
            }
        });
        const midweekChairmanId = midweekSched?.chairman_id || null;

        // Publicadores ativos varões da congregação
        const publishers = await publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Situation.Ativo,
                gender: Gender.Masculino
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege", "unavailabilities"]
        });

        // Quem já está designado nesta mesma reunião
        const assignedInThisMeeting = new Set<string>();
        for (const a of schedule.assignments) {
            if (a.publisher_id) {
                assignedInThisMeeting.add(a.publisher_id);
            }
        }

        // Histórico de designações mecânicas
        const historyAssignments = await mechanicalAssignmentRepository
            .createQueryBuilder("assign")
            .innerJoinAndSelect("assign.schedule", "sched")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.date < :meetingDate", { meetingDate })
            .andWhere("assign.publisher_id IS NOT NULL")
            .orderBy("sched.date", "DESC")
            .getMany();

        const lastAnyDateMap = new Map<string, string>();
        const lastAnyRoleMap = new Map<string, RoleEnum>();
        const lastThisRoleDateMap = new Map<string, string>();

        for (const ha of historyAssignments) {
            if (!ha.publisher_id) continue;
            const dt = ha.schedule.date;

            if (!lastAnyDateMap.has(ha.publisher_id)) {
                lastAnyDateMap.set(ha.publisher_id, dt);
                lastAnyRoleMap.set(ha.publisher_id, ha.role);
            }

            if (ha.role === role && !lastThisRoleDateMap.has(ha.publisher_id)) {
                lastThisRoleDateMap.set(ha.publisher_id, dt);
            }
        }

        const suggestions: MechanicalCandidateSuggestion[] = [];

        for (const pub of publishers) {
            const isQualified = this.isPublisherQualifiedForRole(pub, role);

            // Indisponibilidade
            let isUnavailable = false;
            let unavailabilityReason: string | null = null;
            if (pub.unavailabilities?.length) {
                for (const unav of pub.unavailabilities) {
                    const start = dayjs(unav.startDate);
                    const end = dayjs(unav.endDate);
                    if (
                        (targetDateObj.isAfter(start, "day") || targetDateObj.isSame(start, "day")) &&
                        (targetDateObj.isBefore(end, "day") || targetDateObj.isSame(end, "day"))
                    ) {
                        isUnavailable = true;
                        unavailabilityReason = unav.reason || "Ausente / Indisponível";
                        break;
                    }
                }
            }

            const isMidweekChairman = Boolean(midweekChairmanId && pub.id === midweekChairmanId);
            const isAssignedThisMeeting = assignedInThisMeeting.has(pub.id);

            const lastAny = lastAnyDateMap.get(pub.id) || null;
            const daysSinceLastAny = lastAny ? targetDateObj.diff(dayjs(lastAny), "day") : null;

            const lastThis = lastThisRoleDateMap.get(pub.id) || null;
            const daysSinceLastThisRole = lastThis ? targetDateObj.diff(dayjs(lastThis), "day") : null;

            const lastRole = lastAnyRoleMap.get(pub.id) || null;

            // Cálculo da pontuação inteligente de recomendação
            let score = 1000;
            if (isUnavailable) score -= 50000;
            if (isMidweekChairman) score -= 40000; // Alerta forte, presidente não deve ser colocado
            if (isAssignedThisMeeting) score -= 30000;
            if (!isQualified) score -= 15000;

            // LRU (mais antigo primeiro)
            if (daysSinceLastAny === null) {
                score += 10000; // Nunca fez
            } else {
                score += daysSinceLastAny * 15;
            }

            // Mesclagem (alternância de papéis)
            if (lastRole === role) {
                score -= 4000; // Fez essa mesma função da última vez
            } else if (lastRole !== null) {
                score += 2000; // Bônus de diversificação
            }

            if (daysSinceLastThisRole === null) {
                score += 1500;
            } else {
                score += daysSinceLastThisRole * 5;
            }

            suggestions.push({
                id: pub.id,
                fullName: pub.fullName,
                nickname: pub.nickname,
                isQualified,
                isUnavailable,
                unavailabilityReason,
                isMidweekChairman,
                isAssignedThisMeeting,
                daysSinceLastAny,
                daysSinceLastThisRole,
                lastRole,
                score
            });
        }

        // Ordena: maior pontuação primeiro
        return suggestions.sort((a, b) => b.score - a.score);
    }

    isPublisherQualifiedForRole(pub: Publisher, role: RoleEnum): boolean {
        const names: string[] = [];

        if (pub.privilegesRelation?.length) {
            for (const pp of pub.privilegesRelation) {
                if (pp.privilege?.name) {
                    const isEnded = pp.endDate ? dayjs(pp.endDate).isBefore(dayjs(), "day") : false;
                    if (!isEnded) {
                        names.push(pp.privilege.name);
                    }
                }
            }
        }

        if (pub.privileges && Array.isArray(pub.privileges)) {
            names.push(...pub.privileges);
        }

        const norm = (s: string) =>
            s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        const has = (...targets: string[]) => {
            return names.some(p => {
                const normP = norm(p);
                return targets.some(t => {
                    const normT = norm(t);
                    return normP === normT || normP.includes(normT);
                });
            });
        };

        const isElder = has("Ancião", "Anciao", "Elder");
        const isMS = has("Servo Ministerial", "Ministerial Servant");
        const isElderOrMS = isElder || isMS;

        switch (role) {
            case RoleEnum.ATTENDANT:
                return has("Indicador", "Attendant") || isElderOrMS;
            case RoleEnum.SOUND:
                return has("Som", "Sound", "Som e Mídias", "Sound and Media");
            case RoleEnum.MEDIA:
                return has("Mídias", "Midias", "Media", "Som e Mídias", "Sound and Media");
            case RoleEnum.SOUND_AND_MEDIA:
                return has("Som e Mídias", "Sound and Media") || (has("Som", "Sound") && has("Mídias", "Media"));
            case RoleEnum.ROVING_MIC:
                return has("Microfone Volante", "Microphone Attendant", "Volante");
            case RoleEnum.STAGE_MIC:
                return has("Pedestal", "Stage Attendant", "Microfone Volante", "Microphone Attendant");
            default:
                return true;
        }
    }

    async getQualifications(congregationId: string) {
        const publishers = await publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Situation.Ativo,
                gender: Gender.Masculino
            },
            relations: ["privilegesRelation", "privilegesRelation.privilege"],
            order: { fullName: "ASC" }
        });

        return publishers.map(pub => ({
            id: pub.id,
            fullName: pub.fullName,
            nickname: pub.nickname,
            canAttendant: this.isPublisherQualifiedForRole(pub, RoleEnum.ATTENDANT),
            canSound: this.isPublisherQualifiedForRole(pub, RoleEnum.SOUND),
            canMedia: this.isPublisherQualifiedForRole(pub, RoleEnum.MEDIA),
            canSoundAndMedia: this.isPublisherQualifiedForRole(pub, RoleEnum.SOUND_AND_MEDIA),
            canRovingMic: this.isPublisherQualifiedForRole(pub, RoleEnum.ROVING_MIC),
            canStageMic: this.isPublisherQualifiedForRole(pub, RoleEnum.STAGE_MIC)
        }));
    }

    async toggleQualification(
        publisherId: string,
        role: RoleEnum,
        enabled: boolean
    ) {
        const publisher = await publisherRepository.findOne({
            where: { id: publisherId },
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });

        if (!publisher) {
            throw new NotFoundError("Publicador não encontrado.");
        }

        const rolePrivilegeMap: Record<RoleEnum, { pt: string; en: string }> = {
            [RoleEnum.ATTENDANT]: { pt: "Indicador", en: "Attendant" },
            [RoleEnum.SOUND]: { pt: "Som", en: "Sound" },
            [RoleEnum.MEDIA]: { pt: "Mídias", en: "Media" },
            [RoleEnum.SOUND_AND_MEDIA]: { pt: "Som e Mídias", en: "Sound and Media" },
            [RoleEnum.ROVING_MIC]: { pt: "Microfone Volante", en: "Microphone Attendant" },
            [RoleEnum.STAGE_MIC]: { pt: "Pedestal", en: "Stage Attendant" }
        };

        const target = rolePrivilegeMap[role];
        if (!target) {
            throw new BadRequestError("Função inválida.");
        }

        let privilegesList = publisher.privileges ? [...publisher.privileges] : [];

        if (enabled) {
            if (!privilegesList.includes(target.pt)) {
                privilegesList.push(target.pt);
            }
        } else {
            privilegesList = privilegesList.filter(p => p !== target.pt);
        }

        publisher.privileges = privilegesList;
        await publisherRepository.save(publisher);

        // Sincroniza tabela publisher_privileges
        const privilegeEntity = await privilegeRepository.findOneBy({ name: target.en });
        if (privilegeEntity) {
            if (enabled) {
                const existing = await publisherPrivilegeRepository.findOne({
                    where: {
                        publisher: { id: publisher.id },
                        privilege: { id: privilegeEntity.id }
                    }
                });
                if (!existing) {
                    await publisherPrivilegeRepository.save({
                        publisher,
                        privilege: privilegeEntity,
                        startDate: null,
                        endDate: null
                    });
                }
            } else {
                await publisherPrivilegeRepository.delete({
                    publisher: { id: publisher.id },
                    privilege: { id: privilegeEntity.id }
                });
            }
        }

        return { success: true };
    }
}
