import { XMLParser } from "fast-xml-parser";
import { AppDataSource } from "../../data-source";
import { MidweekMeetingPart } from "../../entities/MidweekMeetingPart";
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
                }

                const gemsPart = new MidweekWorkbookPart();
                gemsPart.workbook_week_id = savedWeek.id;
                gemsPart.section = MidweekSection.TREASURES;
                gemsPart.partType = MidweekPartType.GEMS;
                gemsPart.title = "Joias Espirituais";
                gemsPart.sourceMaterial = savedWeek.weeklyBibleReading;
                gemsPart.timeMinutes = 10;
                gemsPart.method = "Perguntas e respostas";
                gemsPart.requiresAssistant = false;
                gemsPart.orderIndex = order++;
                partsToInsert.push(gemsPart);

                const studentSource = weekData.StudentSourceMaterial;
                if (studentSource && studentSource.BibleReadingMaterial) {
                    const br = studentSource.BibleReadingMaterial;
                    const brText = typeof br === "object" ? br["#text"] || "" : br;
                    const studyPoint = br["@_StudyPoint"] ? parseInt(br["@_StudyPoint"], 10) : null;
                    const brochure = br["@_Brochure"] || "Teaching";
                    const time = br["@_Time"] ? parseInt(br["@_Time"], 10) : 4;
                    const studyDesc = br["@_StudyPointDescription"] || null;

                    if (brText || brText === "") {
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

                // O que você diria? (Sempre a última parte da seção Faça Seu Melhor no Ministério)
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

                // Sincroniza metadados (prompts com acentuação correta, temas, ordem) nas congregações que já abriram a semana, preservando 100% os publicadores designados
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
                        // Limpa partes duplicadas de 'O que você diria' que foram criadas em importações anteriores
                        const wwysParts = sched.parts.filter(mp =>
                            mp.partType === MidweekPartType.WHAT_WOULD_YOU_SAY ||
                            mp.title.toLowerCase().includes("o que você diria") ||
                            mp.title.toLowerCase().includes("o que voce diria")
                        );

                        if (wwysParts.length > 1) {
                            const keepPart = wwysParts.find(p => p.assigned_publisher_id) ||
                                             wwysParts.find(p => p.partType === MidweekPartType.WHAT_WOULD_YOU_SAY) ||
                                             wwysParts[0];

                            for (const extraPart of wwysParts) {
                                if (extraPart.id !== keepPart.id) {
                                    await transactionalEntityManager.remove(MidweekMeetingPart, extraPart);
                                    sched.parts = sched.parts.filter(p => p.id !== extraPart.id);
                                }
                            }
                            keepPart.partType = MidweekPartType.WHAT_WOULD_YOU_SAY;
                            keepPart.title = "O que você diria?";
                            keepPart.method = "Consideração com a assistência";
                            keepPart.requiresAssistant = false;
                        }

                        for (const wbPart of partsToInsert) {
                            const filteredParts = sched.parts.filter(mp =>
                                mp.partType === wbPart.partType &&
                                mp.partType !== MidweekPartType.CUSTOM &&
                                !mp.title.toLowerCase().includes("discurso de serviço")
                            );
                            for (const mp of filteredParts) {
                                mp.title = wbPart.title;
                                mp.prompts = wbPart.prompts;
                                mp.sourceMaterial = wbPart.sourceMaterial;
                                mp.lessonNumber = wbPart.lessonNumber;
                                mp.studyPoint = wbPart.studyPoint;
                                mp.studyPointDescription = wbPart.studyPointDescription;
                                mp.brochure = wbPart.brochure;
                                mp.orderIndex = wbPart.orderIndex;
                                await transactionalEntityManager.save(MidweekMeetingPart, mp);
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
