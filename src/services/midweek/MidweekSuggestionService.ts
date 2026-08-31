import dayjs from "dayjs";
import { MidweekPartType, MidweekSection } from "../../entities/MidweekWorkbookPart";
import { Gender, Publisher, Situation } from "../../entities/Publisher";
import { midweekMeetingPartRepository } from "../../repositories/midweekMeetingPartRepository";
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository";
import { publisherRepository } from "../../repositories/publisherRepository";

export interface PublisherSuggestion {
    id: string;
    fullName: string;
    nickname?: string | null;
    gender: Gender;
    family_id?: string | null;
    lastAssignedThisPartDate: string | null;
    daysSinceLastThisPart: number | null;
    lastAssignedAnyPartDate: string | null;
    daysSinceLastAnyPart: number | null;
    isUnavailable: boolean;
    unavailabilityReason?: string | null;
    hasConflictSameWeek: boolean;
    conflictDescription?: string | null;
    isFamilyMatch?: boolean;
    lastPairedWithStudentDate?: string | null;
    daysSinceLastPairedWithStudent?: number | null;
    timesPairedWithStudent?: number;
    qualificationScore: number;
}

export class MidweekSuggestionService {
    async getSuggestionsForPart(partId: string, congregationId: string, isForAssistant: boolean = false): Promise<PublisherSuggestion[]> {
        const part = await midweekMeetingPartRepository.findOne({
            where: { id: partId },
            relations: ["schedule", "assignedPublisher", "assignedPublisher.family"]
        });

        if (!part || part.schedule.congregation_id !== congregationId) {
            throw new Error("Parte não encontrada.");
        }

        let targetPublisherGender = null;
        let targetPublisherFamilyId = null;

        if (isForAssistant && part.assigned_publisher_id) {
            const student = await publisherRepository.findOne({
                where: { id: part.assigned_publisher_id },
                relations: ["family"]
            });
            if (student) {
                targetPublisherGender = student.gender;
                targetPublisherFamilyId = student.family?.id || null;
            }
            console.log("student family:", student?.family, "targetFamilyId:", targetPublisherFamilyId);
        }


        const meetingDate = part.schedule.meetingDate || part.schedule.weekDate;

        return await this.calculateSuggestions({
            congregationId,
            meetingDate,
            scheduleId: part.schedule_id,
            partType: part.partType,
            section: part.section,
            isForAssistant,
            targetPublisherGender,
            targetPublisherFamilyId,
            currentAssignedPublisherId: part.assigned_publisher_id
        });
    }

    async getSuggestionsForRole(
        role: "CHAIRMAN" | "OPENING_PRAYER" | "CLOSING_PRAYER" | "AUX_COUNSELOR" | "CBS_CONDUCTOR" | "CBS_READER",
        scheduleId: string,
        congregationId: string
    ): Promise<PublisherSuggestion[]> {
        const schedule = await midweekScheduleRepository.findOne({
            where: { id: scheduleId, congregation_id: congregationId }
        });

        if (!schedule) {
            throw new Error("Programação não encontrada.");
        }

        const meetingDate = schedule.meetingDate || schedule.weekDate;

        return await this.calculateSuggestions({
            congregationId,
            meetingDate,
            scheduleId: schedule.id,
            role,
            isForAssistant: false
        });
    }

    private async calculateSuggestions(params: {
        congregationId: string;
        meetingDate: string;
        scheduleId: string;
        partType?: MidweekPartType;
        section?: MidweekSection;
        role?: "CHAIRMAN" | "OPENING_PRAYER" | "CLOSING_PRAYER" | "AUX_COUNSELOR" | "CBS_CONDUCTOR" | "CBS_READER";
        isForAssistant?: boolean;
        targetPublisherGender?: Gender | null;
        targetPublisherFamilyId?: string | null;
        currentAssignedPublisherId?: string | null;
    }): Promise<PublisherSuggestion[]> {
        const { congregationId, meetingDate, scheduleId, partType, role, isForAssistant, targetPublisherGender, targetPublisherFamilyId, currentAssignedPublisherId } = params;

        const publishers = await publisherRepository.find({
            where: {
                congregation: { id: congregationId },
                situation: Situation.Ativo
            },
            relations: [
                "midweekQualification",
                "unavailabilities",
                "family",
                "privilegesRelation",
                "privilegesRelation.privilege"
            ]
        });

        const currentSchedule = await midweekScheduleRepository.findOne({
            where: { id: scheduleId },
            relations: ["parts", "parts.assignedPublisher", "parts.assistantPublisher"]
        });

        const sameWeekAssignments = new Map<string, string[]>();

        if (currentSchedule) {
            if (currentSchedule.chairman_id) this.addConflict(sameWeekAssignments, currentSchedule.chairman_id, "Presidente");
            if (currentSchedule.opening_prayer_id) this.addConflict(sameWeekAssignments, currentSchedule.opening_prayer_id, "Oração Inicial");
            if (currentSchedule.closing_prayer_id) this.addConflict(sameWeekAssignments, currentSchedule.closing_prayer_id, "Oração Final");
            if (currentSchedule.aux_counselor_1_id) this.addConflict(sameWeekAssignments, currentSchedule.aux_counselor_1_id, "Conselheiro Auxiliar");
            if (currentSchedule.aux_counselor_2_id) this.addConflict(sameWeekAssignments, currentSchedule.aux_counselor_2_id, "Conselheiro Auxiliar 2");
            if (currentSchedule.cbs_conductor_id) this.addConflict(sameWeekAssignments, currentSchedule.cbs_conductor_id, "Dirigente do Estudo Bíblico");
            if (currentSchedule.cbs_reader_id) this.addConflict(sameWeekAssignments, currentSchedule.cbs_reader_id, "Leitor do Estudo Bíblico");

            if (currentSchedule.parts) {
                for (const p of currentSchedule.parts) {
                    if (p.assigned_publisher_id) {
                        this.addConflict(sameWeekAssignments, p.assigned_publisher_id, p.title);
                    }
                    if (p.assistant_publisher_id) {
                        this.addConflict(sameWeekAssignments, p.assistant_publisher_id, `Ajudante em: ${p.title}`);
                    }
                }
            }
        }

        const lastDateThisPartMap = new Map<string, string>();
        const lastDateAnyPartMap = new Map<string, string>();
        const pairHistoryMap = new Map<string, { lastDate: string; count: number }>();

        // 1. HISTÓRICO DE CARGOS E FUNÇÕES GERAIS (MidweekSchedule)
        const historySchedules = await midweekScheduleRepository
            .createQueryBuilder("sched")
            .where("sched.congregation_id = :congregationId", { congregationId })
            .andWhere("sched.weekDate < :meetingDate", { meetingDate })
            .orderBy("sched.weekDate", "DESC")
            .getMany();

        for (const hs of historySchedules) {
            const date = hs.meetingDate || hs.weekDate;

            const recordRole = (pubId: string | null, targetRole: string) => {
                if (!pubId) return;
                if (!lastDateAnyPartMap.has(pubId)) {
                    lastDateAnyPartMap.set(pubId, date);
                }
                if (role === targetRole && !lastDateThisPartMap.has(pubId)) {
                    lastDateThisPartMap.set(pubId, date);
                }
            };

            recordRole(hs.chairman_id, "CHAIRMAN");
            recordRole(hs.opening_prayer_id, "OPENING_PRAYER");
            recordRole(hs.closing_prayer_id, "CLOSING_PRAYER");
            recordRole(hs.cbs_conductor_id, "CBS_CONDUCTOR");
            recordRole(hs.cbs_reader_id, "CBS_READER");
            recordRole(hs.aux_counselor_1_id, "AUX_COUNSELOR");
            recordRole(hs.aux_counselor_2_id, "AUX_COUNSELOR");
        }

        // 2. HISTÓRICO DE PARTES (MidweekMeetingPart)
        const historyParts = await midweekMeetingPartRepository
            .createQueryBuilder("part")
            .innerJoinAndSelect("part.schedule", "schedule")
            .where("schedule.congregation_id = :congregationId", { congregationId })
            .andWhere("schedule.weekDate < :meetingDate", { meetingDate })
            .andWhere("(part.assigned_publisher_id IS NOT NULL OR part.assistant_publisher_id IS NOT NULL)")
            .orderBy("schedule.weekDate", "DESC")
            .getMany();

        for (const hp of historyParts) {
            const partDate = hp.schedule.meetingDate || hp.schedule.weekDate;

            if (hp.assigned_publisher_id) {
                const pubId = hp.assigned_publisher_id;
                if (!lastDateAnyPartMap.has(pubId)) {
                    lastDateAnyPartMap.set(pubId, partDate);
                }
                if (partType && hp.partType === partType && !lastDateThisPartMap.has(pubId)) {
                    lastDateThisPartMap.set(pubId, partDate);
                }
            }

            if (hp.assistant_publisher_id) {
                const asstId = hp.assistant_publisher_id;
                if (!lastDateAnyPartMap.has(asstId)) {
                    lastDateAnyPartMap.set(asstId, partDate);
                }
                if (isForAssistant && !lastDateThisPartMap.has(asstId)) {
                    lastDateThisPartMap.set(asstId, partDate);
                }
            }

            if (isForAssistant && currentAssignedPublisherId && hp.assigned_publisher_id && hp.assistant_publisher_id) {
                let partnerId: string | null = null;
                if (hp.assigned_publisher_id === currentAssignedPublisherId) {
                    partnerId = hp.assistant_publisher_id;
                } else if (hp.assistant_publisher_id === currentAssignedPublisherId) {
                    partnerId = hp.assigned_publisher_id;
                }

                if (partnerId) {
                    const existing = pairHistoryMap.get(partnerId);
                    if (!existing) {
                        pairHistoryMap.set(partnerId, { lastDate: partDate, count: 1 });
                    } else {
                        existing.count += 1;
                    }
                }
            }
        }

        const suggestions: PublisherSuggestion[] = [];
        const targetDateObj = dayjs(meetingDate);

        for (const pub of publishers) {
            if (isForAssistant && currentAssignedPublisherId && pub.id === currentAssignedPublisherId) {
                continue;
            }

            const isQualified = this.checkQualification(pub, partType, role, isForAssistant);
            if (!isQualified) {
                continue;
            }

            let isFamilyMatch = false;
            if (isForAssistant && targetPublisherGender) {
                const sameGender = pub.gender === targetPublisherGender;
                const pubFamilyId = pub.family?.id || pub.family_id || null;
                const sameFamily = Boolean(
                    targetPublisherFamilyId && pubFamilyId && targetPublisherFamilyId === pubFamilyId
                );

                if (!sameGender && !sameFamily) {
                    continue;
                }

                if (sameFamily) {
                    isFamilyMatch = true;
                }
            }

            let isUnavailable = false;
            let unavailabilityReason: string | null = null;

            if (pub.unavailabilities && pub.unavailabilities.length > 0) {
                for (const unav of pub.unavailabilities) {
                    const start = dayjs(unav.startDate);
                    const end = dayjs(unav.endDate);
                    if (
                        (targetDateObj.isAfter(start, 'day') || targetDateObj.isSame(start, 'day')) &&
                        (targetDateObj.isBefore(end, 'day') || targetDateObj.isSame(end, 'day'))
                    ) {
                        isUnavailable = true;
                        unavailabilityReason = unav.reason || "Ausente / Indisponível";
                        break;
                    }
                }
            }

            const conflicts = sameWeekAssignments.get(pub.id) || [];
            const hasConflictSameWeek = conflicts.length > 0;
            const conflictDescription = hasConflictSameWeek ? conflicts.join(", ") : null;

            const lastThisPart = lastDateThisPartMap.get(pub.id) || null;
            const daysThisPart = lastThisPart ? targetDateObj.diff(dayjs(lastThisPart), 'day') : null;

            const lastAnyPart = lastDateAnyPartMap.get(pub.id) || null;
            const daysAnyPart = lastAnyPart ? targetDateObj.diff(dayjs(lastAnyPart), 'day') : null;

            const pairInfo = isForAssistant ? pairHistoryMap.get(pub.id) : null;
            const lastPairedDate = pairInfo ? pairInfo.lastDate : null;
            const daysSinceLastPaired = lastPairedDate ? targetDateObj.diff(dayjs(lastPairedDate), 'day') : null;
            const timesPaired = pairInfo ? pairInfo.count : 0;

            // 🎯 CÁLCULO DA PONTUAÇÃO COM ALGORITMO DE RODÍZIO JUSTO (LRU - Least Recently Used)
            let score = 1000;

            // 1. Penalidade absoluta para indisponibilidade ou conflito na mesma semana
            if (isUnavailable) score -= 20000;
            if (hasConflictSameWeek) score -= 10000;

            // 2. Rodízio da MESMA função/parte
            if (daysThisPart === null) {
                // Irmão nunca fez esta função/parte antes na congregação: PRIORIDADE ALTA
                score += 3000;
            } else {
                // Quanto mais tempo se passou, mais pontos ganha
                score += Math.min(daysThisPart * 15, 2500);

                // PENALIDADE SEVERA DE CONSECUTIVIDADE (Anti-Repetição em semanas seguidas)
                if (daysThisPart <= 7) {
                    score -= 6000; // Fez na semana anterior: bloqueio quase total
                } else if (daysThisPart <= 14) {
                    score -= 3000; // Fez há 2 semanas
                } else if (daysThisPart <= 21) {
                    score -= 1200; // Fez há 3 semanas
                }
            }

            // 3. Rodízio GERAL de qualquer parte na congregação
            if (daysAnyPart === null) {
                score += 1500;
            } else {
                score += Math.min(daysAnyPart * 5, 1000);

                if (daysAnyPart <= 7) {
                    score -= 1500; // Fez qualquer parte semana passada: descanso
                } else if (daysAnyPart <= 14) {
                    score -= 600;
                }
            }

            // 4. Critérios para Ajudante de Estudante
            if (isForAssistant) {
                if (isFamilyMatch) {
                    score += 800; // Prioriza familiares (marido/esposa, pai/filho)
                }
                if (timesPaired === 0) {
                    score += 300; // Diversifica duplas
                } else if (daysSinceLastPaired !== null && daysSinceLastPaired < 60) {
                    score -= 500; // Evita repetir a mesma dupla muito recentemente
                }
            }

            suggestions.push({
                id: pub.id,
                fullName: pub.fullName,
                nickname: pub.nickname,
                gender: pub.gender,
                family_id: pub.family?.id || pub.family_id || null,
                lastAssignedThisPartDate: lastThisPart,
                daysSinceLastThisPart: daysThisPart,
                lastAssignedAnyPartDate: lastAnyPart,
                daysSinceLastAnyPart: daysAnyPart,
                isUnavailable,
                unavailabilityReason,
                hasConflictSameWeek,
                conflictDescription,
                isFamilyMatch,
                lastPairedWithStudentDate: lastPairedDate,
                daysSinceLastPairedWithStudent: daysSinceLastPaired,
                timesPairedWithStudent: timesPaired,
                qualificationScore: score
            });
        }

        // Ordenação decrescente de pontuação
        return suggestions.sort((a, b) => {
            if (b.qualificationScore !== a.qualificationScore) {
                return b.qualificationScore - a.qualificationScore;
            }
            // Desempate por dias da última designação geral
            const aDays = a.daysSinceLastAnyPart ?? 9999;
            const bDays = b.daysSinceLastAnyPart ?? 9999;
            if (bDays !== aDays) {
                return bDays - aDays;
            }
            // Desempate estável alfabético
            return a.fullName.localeCompare(b.fullName);
        });
    }

    public hasPrivilege(pub: Publisher, ...targetPrivileges: string[]): boolean {
        const names: string[] = [];

        // 1. Extrai privilégios da tabela publisher_privileges
        if (pub.privilegesRelation && Array.isArray(pub.privilegesRelation)) {
            for (const pp of pub.privilegesRelation) {
                if (pp.privilege && pp.privilege.name) {
                    const isEnded = pp.endDate ? dayjs(pp.endDate).isBefore(dayjs(), "day") : false;
                    if (!isEnded) {
                        names.push(pp.privilege.name);
                    }
                }
            }
        }

        // 2. Extrai da coluna legada privileges
        if (pub.privileges && Array.isArray(pub.privileges)) {
            names.push(...pub.privileges);
        }

        return names.some(p => {
            const normP = p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            return targetPrivileges.some(tp => {
                const normTp = tp.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return normP === normTp || normP.includes(normTp);
            });
        });
    }

    private checkQualification(
        pub: Publisher,
        partType?: MidweekPartType,
        role?: string,
        isForAssistant: boolean = false
    ): boolean {
        // 1. PRIORIDADE MÁXIMA: Tabela publisher_midweek_qualifications
        const q = pub.midweekQualification;

        if (isForAssistant) {
            return q ? q.canBeAssistant : true;
        }

        // 2. FALLBACK/PADRÃO: Privilégios de publisher_privileges + privileges + Gênero
        const isElder = this.hasPrivilege(pub, "Ancião", "Anciao", "Presidente", "Elder");
        const isMinisterialServant = this.hasPrivilege(pub, "Servo Ministerial", "Servo ministerial", "Ministerial Servant");
        const isElderOrMS = isElder || isMinisterialServant;
        const isMale = pub.gender === Gender.Masculino;

        if (role) {
            switch (role) {
                case "CHAIRMAN":
                    return q ? q.canBeChairman : isElder;
                case "OPENING_PRAYER":
                case "CLOSING_PRAYER":
                    return q ? q.canPray : isMale;
                case "AUX_COUNSELOR":
                    return q ? q.canAuxCounselor : isElder;
                case "CBS_CONDUCTOR":
                    return q ? q.canCbsConductor : isElder;
                case "CBS_READER":
                    return q ? q.canCbsReader : isMale;
            }
        }

        if (partType) {
            switch (partType) {
                case MidweekPartType.TALK:
                    return q ? q.canTreasuresTalk : isElderOrMS;
                case MidweekPartType.GEMS:
                    return q ? q.canSpiritualGems : isElderOrMS;
                case MidweekPartType.BIBLE_READING:
                    return q ? q.canBibleReading : isMale;
                case MidweekPartType.INITIAL_CALL:
                    return q ? q.canStudentInitialCall : true;
                case MidweekPartType.RETURN_VISIT:
                    return q ? q.canStudentReturnVisit : true;
                case MidweekPartType.BIBLE_STUDY:
                    return q ? q.canStudentBibleStudy : true;
                case MidweekPartType.EXPLAIN_BELIEFS:
                    return q ? q.canStudentExplainBeliefs : true;
                case MidweekPartType.STUDENT_TALK:
                    return q ? q.canStudentTalk : isMale;
                case MidweekPartType.LOCAL_NEEDS:
                    return q ? q.canLocalNeeds : isElder;
                case MidweekPartType.LIVING_ITEM:
                case MidweekPartType.WHAT_WOULD_YOU_SAY:
                    return q ? q.canLivingParts : isElderOrMS;
                case MidweekPartType.CBS:
                    return q ? q.canCbsConductor : isElder;
                default:
                    return true;
            }
        }

        return true;
    }

    private addConflict(map: Map<string, string[]>, pubId: string, description: string) {
        const existing = map.get(pubId) || [];
        existing.push(description);
        map.set(pubId, existing);
    }
}
