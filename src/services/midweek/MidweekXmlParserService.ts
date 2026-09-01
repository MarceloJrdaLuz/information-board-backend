import { XMLParser } from "fast-xml-parser";
import { AppDataSource } from "../../data-source";
import { MidweekMeetingPart, MidweekRoom } from "../../entities/MidweekMeetingPart";
import { MidweekSchedule } from "../../entities/MidweekSchedule";
import { MidweekPartType, MidweekSection, MidweekWorkbookPart } from "../../entities/MidweekWorkbookPart";
import { MidweekWorkbookWeek } from "../../entities/MidweekWorkbookWeek";

export class MidweekXmlParserService {
    private parser: XMLParser;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            textNodeName: "#text",
            trimValues: true
        });
    }

    async parseAndSaveWorkbook(xmlContent: string): Promise<{ importedWeeks: number; totalParts: number }> {
        const parsed = this.parser.parse(xmlContent);

        if (!parsed || !parsed.MeetingWorkBook) {
            throw new Error("Formato de XML inválido: elemento <MeetingWorkBook> não encontrado.");
        }

        const workbook = parsed.MeetingWorkBook;
        let importedWeeksCount = 0;
        let totalPartsCount = 0;

        for (const key of Object.keys(workbook)) {
            if (!key.startsWith("W") || key.length !== 9) {
                continue;
            }

            const rawDate = key.substring(1);
            const year = rawDate.substring(0, 4);
            const month = rawDate.substring(4, 6);
            const day = rawDate.substring(6, 8);
            const formattedWeekDate = `${year}-${month}-${day}`;

            const weekData = workbook[key];
            if (!weekData) continue;

            await AppDataSource.transaction(async (transactionalEntityManager) => {
                let week = await transactionalEntityManager.findOne(MidweekWorkbookWeek, {
                    where: { weekDate: formattedWeekDate }
                });

                if (!week) {
                    week = new MidweekWorkbookWeek();
                    week.weekDate = formattedWeekDate;
                }

                week.weeklyBibleReading = weekData.WeeklyBibleReading || null;
                week.watchtowerStudyTheme = weekData.WatchtowerStudyTheme || null;
                week.songOpen = weekData.SongOpen ? parseInt(weekData.SongOpen, 10) : null;
                week.songMiddle = weekData.SongMiddle ? parseInt(weekData.SongMiddle, 10) : null;
                week.songEnd = weekData.SongEnd ? parseInt(weekData.SongEnd, 10) : null;
                week.cbsSource = weekData.CongregationBibleStudySourceMaterial || null;
                week.presentations = weekData.Presentations || null;

                const savedWeek = await transactionalEntityManager.save(MidweekWorkbookWeek, week);

                await transactionalEntityManager.delete(MidweekWorkbookPart, {
                    workbook_week_id: savedWeek.id
                });

                const partsToInsert: MidweekWorkbookPart[] = [];
                let order = 1;

                if (weekData.TreasuresFromGodsWord) {
                    const theme = weekData.TreasuresFromGodsWord.Theme || "Tesouros da Palavra de Deus";
                    const method = weekData.TreasuresFromGodsWord.Method || "Discurso";

                    const treasuresTalkPart = new MidweekWorkbookPart();
                    treasuresTalkPart.workbook_week_id = savedWeek.id;
                    treasuresTalkPart.section = MidweekSection.TREASURES;
                    treasuresTalkPart.partType = MidweekPartType.TALK;
                    treasuresTalkPart.title = theme;
                    treasuresTalkPart.timeMinutes = 10;
                    treasuresTalkPart.method = method;
                    treasuresTalkPart.requiresAssistant = false;
                    treasuresTalkPart.orderIndex = order++;
                    partsToInsert.push(treasuresTalkPart);

                    const gemsPart = new MidweekWorkbookPart();
                    gemsPart.workbook_week_id = savedWeek.id;
                    gemsPart.section = MidweekSection.TREASURES;
                    gemsPart.partType = MidweekPartType.GEMS;
                    gemsPart.title = "Joias Espirituais";
                    gemsPart.timeMinutes = 10;
                    gemsPart.method = "Perguntas e respostas";
                    gemsPart.requiresAssistant = false;
                    gemsPart.orderIndex = order++;
                    partsToInsert.push(gemsPart);
                }

                const studentSource = weekData.StudentSourceMaterial;

                if (studentSource) {
                    const brMat = studentSource.BibleReadingMaterial;
                    if (brMat) {
                        const brText = typeof brMat === "object" ? brMat["#text"] || "" : brMat;
                        const studyPoint = brMat["@_StudyPoint"] ? parseInt(brMat["@_StudyPoint"], 10) : null;
                        const studyDesc = brMat["@_StudyPointDescription"] || null;
                        const brochure = brMat["@_Brochure"] || "Teaching";
                        const time = brMat["@_Time"] ? parseInt(brMat["@_Time"], 10) : 4;

                        const bibleReadingPart = new MidweekWorkbookPart();
                        bibleReadingPart.workbook_week_id = savedWeek.id;
                        bibleReadingPart.section = MidweekSection.TREASURES;
                        bibleReadingPart.partType = MidweekPartType.BIBLE_READING;
                        bibleReadingPart.title = "Leitura da Bíblia";
                        bibleReadingPart.sourceMaterial = brText;
                        bibleReadingPart.timeMinutes = time;
                        bibleReadingPart.studyPoint = studyPoint;
                        bibleReadingPart.studyPointDescription = studyDesc;
                        bibleReadingPart.brochure = brochure;
                        bibleReadingPart.requiresAssistant = false;
                        bibleReadingPart.orderIndex = order++;
                        partsToInsert.push(bibleReadingPart);
                    }
                }

                if (studentSource && studentSource.WhatWouldYouSay && studentSource.WhatWouldYouSay["@_Included"] === "1") {
                    const wwys = studentSource.WhatWouldYouSay;
                    const wwysPart = new MidweekWorkbookPart();
                    wwysPart.workbook_week_id = savedWeek.id;
                    wwysPart.section = MidweekSection.MINISTRY;
                    wwysPart.partType = MidweekPartType.WHAT_WOULD_YOU_SAY;
                    wwysPart.title = wwys.Theme || "O que você diria?";
                    wwysPart.sourceMaterial = wwys.SourceMaterial || null;
                    wwysPart.timeMinutes = wwys["@_Time"] ? parseInt(wwys["@_Time"], 10) : 6;
                    wwysPart.method = "Consideração com a assistência";
                    wwysPart.requiresAssistant = false;

                    if (wwys.Prompts && wwys.Prompts.Prompt) {
                        const promptList = Array.isArray(wwys.Prompts.Prompt) ? wwys.Prompts.Prompt : [wwys.Prompts.Prompt];
                        wwysPart.prompts = promptList
                            .filter((p: any) => p["@_Included"] === "1")
                            .map((p: any) => (typeof p === "object" ? p["#text"] || "" : p));
                    }

                    wwysPart.orderIndex = order++;
                    partsToInsert.push(wwysPart);
                }

                const assignTypes = weekData.StudentAssignTypes || {};

                for (let i = 1; i <= 4; i++) {
                    const matKey = `StudentTalk${i}Material`;
                    const typeKey = `StudentTalk${i}Type`;

                    const talkMat = studentSource ? studentSource[matKey] : null;
                    const talkTypeObj = assignTypes[typeKey];

                    if (!talkMat || talkMat["@_Included"] === "0") {
                        continue;
                    }

                    const talkText = typeof talkMat === "object" ? talkMat["#text"] || "" : talkMat;
                    const lesson = talkMat["@_Lesson"] ? parseInt(talkMat["@_Lesson"], 10) : null;
                    const studyPoint = talkMat["@_StudyPoint"] ? parseInt(talkMat["@_StudyPoint"], 10) : null;
                    const studyDesc = talkMat["@_StudyPointDescription"] || null;
                    const brochure = talkMat["@_Brochure"] || "LovePeople";
                    const time = talkMat["@_Time"] ? parseInt(talkMat["@_Time"], 10) : 3;

                    const typeName = talkTypeObj ? (typeof talkTypeObj === "object" ? talkTypeObj["#text"] || "" : talkTypeObj) : "Parte de Estudante";
                    const isTalk = talkTypeObj && talkTypeObj["@_IsTalk"] === "1";

                    const studentPart = new MidweekWorkbookPart();
                    studentPart.workbook_week_id = savedWeek.id;
                    studentPart.section = MidweekSection.MINISTRY;
                    studentPart.partType = this.mapStudentPartType(typeName, isTalk);
                    studentPart.title = typeName || "Designação de Estudante";
                    studentPart.sourceMaterial = talkText;
                    studentPart.timeMinutes = time;
                    studentPart.lessonNumber = lesson;
                    studentPart.studyPoint = studyPoint;
                    studentPart.studyPointDescription = studyDesc;
                    studentPart.brochure = brochure;
                    studentPart.requiresAssistant = !isTalk;
                    studentPart.method = isTalk ? "Discurso" : "Demonstração";
                    studentPart.orderIndex = order++;
                    partsToInsert.push(studentPart);
                }

                if (weekData.LivingAsChristians && weekData.LivingAsChristians.Item) {
                    const items = Array.isArray(weekData.LivingAsChristians.Item)
                        ? weekData.LivingAsChristians.Item
                        : [weekData.LivingAsChristians.Item];

                    for (const item of items) {
                        const theme = item.Theme || "Nossa Vida Cristã";
                        const method = item.Method || "Consideração";
                        const time = item.Time ? parseInt(item.Time, 10) : 15;

                        const livingPart = new MidweekWorkbookPart();
                        livingPart.workbook_week_id = savedWeek.id;
                        livingPart.section = MidweekSection.LIVING;
                        livingPart.partType = theme.toLowerCase().includes("necessidades locais")
                            ? MidweekPartType.LOCAL_NEEDS
                            : MidweekPartType.LIVING_ITEM;
                        livingPart.title = theme;
                        livingPart.timeMinutes = time;
                        livingPart.method = method;
                        livingPart.requiresAssistant = false;
                        livingPart.orderIndex = order++;
                        partsToInsert.push(livingPart);
                    }
                }

                if (savedWeek.cbsSource) {
                    const cbsPart = new MidweekWorkbookPart();
                    cbsPart.workbook_week_id = savedWeek.id;
                    cbsPart.section = MidweekSection.LIVING;
                    cbsPart.partType = MidweekPartType.CBS;
                    cbsPart.title = "Estudo Bíblico de Congregação";
                    cbsPart.sourceMaterial = savedWeek.cbsSource;
                    cbsPart.timeMinutes = 30;
                    cbsPart.method = "Perguntas e respostas com leitor";
                    cbsPart.requiresAssistant = false;
                    cbsPart.orderIndex = order++;
                    partsToInsert.push(cbsPart);
                }

                if (partsToInsert.length > 0) {
                    await transactionalEntityManager.save(MidweekWorkbookPart, partsToInsert);
                    totalPartsCount += partsToInsert.length;
                }

                // Sincroniza metadados nas congregações que já abriram a semana, preservando 100% os publicadores designados
                const existingSchedules = await transactionalEntityManager.find(MidweekSchedule, {
                    where: { weekDate: savedWeek.weekDate },
                    relations: ["parts"]
                });

                for (const sched of existingSchedules) {
                    sched.weeklyBibleReading = savedWeek.weeklyBibleReading;
                    sched.watchtowerStudyTheme = savedWeek.watchtowerStudyTheme;
                    sched.songOpen = savedWeek.songOpen;
                    sched.songMiddle = savedWeek.songMiddle;
                    sched.songEnd = savedWeek.songEnd;
                    await transactionalEntityManager.save(MidweekSchedule, sched);

                    if (sched.parts && sched.parts.length > 0) {
                        // Sincroniza cada seção de forma ordenada por posição relativa
                        for (const section of [MidweekSection.TREASURES, MidweekSection.MINISTRY, MidweekSection.LIVING]) {
                            const sectionWbParts = partsToInsert
                                .filter(wp => wp.section === section)
                                .sort((a, b) => a.orderIndex - b.orderIndex);

                            const sectionMainSchedParts = sched.parts
                                .filter(mp => mp.section === section && mp.room === MidweekRoom.MAIN && mp.partType !== MidweekPartType.CUSTOM && !mp.title.toLowerCase().includes("discurso de serviço"))
                                .sort((a, b) => a.orderIndex - b.orderIndex);

                            for (let idx = 0; idx < sectionWbParts.length; idx++) {
                                const wbPart = sectionWbParts[idx];
                                const schedPart = sectionMainSchedParts[idx];

                                if (schedPart) {
                                    schedPart.workbook_part_id = wbPart.id;
                                    schedPart.title = wbPart.title;
                                    schedPart.prompts = wbPart.prompts;
                                    schedPart.sourceMaterial = wbPart.sourceMaterial;
                                    schedPart.lessonNumber = wbPart.lessonNumber;
                                    schedPart.studyPoint = wbPart.studyPoint;
                                    schedPart.studyPointDescription = wbPart.studyPointDescription;
                                    schedPart.brochure = wbPart.brochure;
                                    schedPart.orderIndex = wbPart.orderIndex;
                                    schedPart.timeMinutes = wbPart.timeMinutes;
                                    schedPart.method = wbPart.method;
                                    schedPart.requiresAssistant = wbPart.requiresAssistant;
                                    schedPart.partType = wbPart.partType;
                                    await transactionalEntityManager.save(MidweekMeetingPart, schedPart);
                                }

                                // Atualiza também as salas auxiliares na mesma posição
                                const auxRooms = [MidweekRoom.AUXILIARY_1, MidweekRoom.AUXILIARY_2];
                                for (const room of auxRooms) {
                                    const roomParts = sched.parts
                                        .filter(mp => mp.section === section && mp.room === room && mp.partType !== MidweekPartType.CUSTOM)
                                        .sort((a, b) => a.orderIndex - b.orderIndex);

                                    const auxPart = roomParts[idx];
                                    if (auxPart) {
                                        auxPart.workbook_part_id = wbPart.id;
                                        auxPart.title = wbPart.title;
                                        auxPart.prompts = wbPart.prompts;
                                        auxPart.sourceMaterial = wbPart.sourceMaterial;
                                        auxPart.lessonNumber = wbPart.lessonNumber;
                                        auxPart.studyPoint = wbPart.studyPoint;
                                        auxPart.studyPointDescription = wbPart.studyPointDescription;
                                        auxPart.brochure = wbPart.brochure;
                                        auxPart.timeMinutes = wbPart.timeMinutes;
                                        auxPart.method = wbPart.method;
                                        auxPart.requiresAssistant = wbPart.requiresAssistant;
                                        auxPart.partType = wbPart.partType;
                                        await transactionalEntityManager.save(MidweekMeetingPart, auxPart);
                                    }
                                }
                            }
                        }
                    }
                }
            });

            importedWeeksCount++;
        }

        return {
            importedWeeks: importedWeeksCount,
            totalParts: totalPartsCount
        };
    }

    private mapStudentPartType(typeName: string, isTalk: boolean): MidweekPartType {
        const lower = typeName.toLowerCase();
        if (isTalk || lower.includes("discurso")) {
            return MidweekPartType.STUDENT_TALK;
        }
        if (lower.includes("iniciando conversas") || lower.includes("iniciar conversas") || lower.includes("primeira conversa")) {
            return MidweekPartType.INITIAL_CALL;
        }
        if (lower.includes("cultivando o interesse") || lower.includes("revisita")) {
            return MidweekPartType.RETURN_VISIT;
        }
        if (lower.includes("fazendo discípulos") || lower.includes("estudo bíblico")) {
            return MidweekPartType.BIBLE_STUDY;
        }
        if (lower.includes("explicando suas crenças")) {
            return MidweekPartType.EXPLAIN_BELIEFS;
        }
        return MidweekPartType.INITIAL_CALL;
    }
}
