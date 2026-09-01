"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidweekXmlParserService = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const data_source_1 = require("../../data-source");
const MidweekMeetingPart_1 = require("../../entities/MidweekMeetingPart");
const MidweekSchedule_1 = require("../../entities/MidweekSchedule");
const MidweekWorkbookPart_1 = require("../../entities/MidweekWorkbookPart");
const MidweekWorkbookWeek_1 = require("../../entities/MidweekWorkbookWeek");
class MidweekXmlParserService {
    constructor() {
        this.parser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            textNodeName: "#text",
            trimValues: true
        });
    }
    async parseAndSaveWorkbook(xmlContent) {
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
            if (!weekData)
                continue;
            await data_source_1.AppDataSource.transaction(async (transactionalEntityManager) => {
                let week = await transactionalEntityManager.findOne(MidweekWorkbookWeek_1.MidweekWorkbookWeek, {
                    where: { weekDate: formattedWeekDate }
                });
                if (!week) {
                    week = new MidweekWorkbookWeek_1.MidweekWorkbookWeek();
                    week.weekDate = formattedWeekDate;
                }
                week.weeklyBibleReading = weekData.WeeklyBibleReading || null;
                week.watchtowerStudyTheme = weekData.WatchtowerStudyTheme || null;
                week.songOpen = weekData.SongOpen ? parseInt(weekData.SongOpen, 10) : null;
                week.songMiddle = weekData.SongMiddle ? parseInt(weekData.SongMiddle, 10) : null;
                week.songEnd = weekData.SongEnd ? parseInt(weekData.SongEnd, 10) : null;
                week.cbsSource = weekData.CongregationBibleStudySourceMaterial || null;
                week.presentations = weekData.Presentations || null;
                const savedWeek = await transactionalEntityManager.save(MidweekWorkbookWeek_1.MidweekWorkbookWeek, week);
                await transactionalEntityManager.delete(MidweekWorkbookPart_1.MidweekWorkbookPart, {
                    workbook_week_id: savedWeek.id
                });
                const partsToInsert = [];
                let order = 1;
                if (weekData.TreasuresFromGodsWord) {
                    const theme = weekData.TreasuresFromGodsWord.Theme || "Tesouros da Palavra de Deus";
                    const method = weekData.TreasuresFromGodsWord.Method || "Discurso";
                    const treasuresTalkPart = new MidweekWorkbookPart_1.MidweekWorkbookPart();
                    treasuresTalkPart.workbook_week_id = savedWeek.id;
                    treasuresTalkPart.section = MidweekWorkbookPart_1.MidweekSection.TREASURES;
                    treasuresTalkPart.partType = MidweekWorkbookPart_1.MidweekPartType.TALK;
                    treasuresTalkPart.title = theme;
                    treasuresTalkPart.timeMinutes = 10;
                    treasuresTalkPart.method = method;
                    treasuresTalkPart.requiresAssistant = false;
                    treasuresTalkPart.orderIndex = order++;
                    partsToInsert.push(treasuresTalkPart);
                    const gemsPart = new MidweekWorkbookPart_1.MidweekWorkbookPart();
                    gemsPart.workbook_week_id = savedWeek.id;
                    gemsPart.section = MidweekWorkbookPart_1.MidweekSection.TREASURES;
                    gemsPart.partType = MidweekWorkbookPart_1.MidweekPartType.GEMS;
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
                        const bibleReadingPart = new MidweekWorkbookPart_1.MidweekWorkbookPart();
                        bibleReadingPart.workbook_week_id = savedWeek.id;
                        bibleReadingPart.section = MidweekWorkbookPart_1.MidweekSection.TREASURES;
                        bibleReadingPart.partType = MidweekWorkbookPart_1.MidweekPartType.BIBLE_READING;
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
                    const wwysPart = new MidweekWorkbookPart_1.MidweekWorkbookPart();
                    wwysPart.workbook_week_id = savedWeek.id;
                    wwysPart.section = MidweekWorkbookPart_1.MidweekSection.MINISTRY;
                    wwysPart.partType = MidweekWorkbookPart_1.MidweekPartType.WHAT_WOULD_YOU_SAY;
                    wwysPart.title = wwys.Theme || "O que você diria?";
                    wwysPart.sourceMaterial = wwys.SourceMaterial || null;
                    wwysPart.timeMinutes = wwys["@_Time"] ? parseInt(wwys["@_Time"], 10) : 6;
                    wwysPart.method = "Consideração com a assistência";
                    wwysPart.requiresAssistant = false;
                    if (wwys.Prompts && wwys.Prompts.Prompt) {
                        const promptList = Array.isArray(wwys.Prompts.Prompt) ? wwys.Prompts.Prompt : [wwys.Prompts.Prompt];
                        wwysPart.prompts = promptList
                            .filter((p) => p["@_Included"] === "1")
                            .map((p) => (typeof p === "object" ? p["#text"] || "" : p));
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
                    const studentPart = new MidweekWorkbookPart_1.MidweekWorkbookPart();
                    studentPart.workbook_week_id = savedWeek.id;
                    studentPart.section = MidweekWorkbookPart_1.MidweekSection.MINISTRY;
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
                        const livingPart = new MidweekWorkbookPart_1.MidweekWorkbookPart();
                        livingPart.workbook_week_id = savedWeek.id;
                        livingPart.section = MidweekWorkbookPart_1.MidweekSection.LIVING;
                        livingPart.partType = theme.toLowerCase().includes("necessidades locais")
                            ? MidweekWorkbookPart_1.MidweekPartType.LOCAL_NEEDS
                            : MidweekWorkbookPart_1.MidweekPartType.LIVING_ITEM;
                        livingPart.title = theme;
                        livingPart.timeMinutes = time;
                        livingPart.method = method;
                        livingPart.requiresAssistant = false;
                        livingPart.orderIndex = order++;
                        partsToInsert.push(livingPart);
                    }
                }
                if (savedWeek.cbsSource) {
                    const cbsPart = new MidweekWorkbookPart_1.MidweekWorkbookPart();
                    cbsPart.workbook_week_id = savedWeek.id;
                    cbsPart.section = MidweekWorkbookPart_1.MidweekSection.LIVING;
                    cbsPart.partType = MidweekWorkbookPart_1.MidweekPartType.CBS;
                    cbsPart.title = "Estudo Bíblico de Congregação";
                    cbsPart.sourceMaterial = savedWeek.cbsSource;
                    cbsPart.timeMinutes = 30;
                    cbsPart.method = "Perguntas e respostas com leitor";
                    cbsPart.requiresAssistant = false;
                    cbsPart.orderIndex = order++;
                    partsToInsert.push(cbsPart);
                }
                if (partsToInsert.length > 0) {
                    await transactionalEntityManager.save(MidweekWorkbookPart_1.MidweekWorkbookPart, partsToInsert);
                    totalPartsCount += partsToInsert.length;
                }
                // Sincroniza metadados nas congregações que já abriram a semana, preservando 100% os publicadores designados
                const existingSchedules = await transactionalEntityManager.find(MidweekSchedule_1.MidweekSchedule, {
                    where: { weekDate: savedWeek.weekDate },
                    relations: ["parts"]
                });
                for (const sched of existingSchedules) {
                    sched.weeklyBibleReading = savedWeek.weeklyBibleReading;
                    sched.watchtowerStudyTheme = savedWeek.watchtowerStudyTheme;
                    sched.songOpen = savedWeek.songOpen;
                    sched.songMiddle = savedWeek.songMiddle;
                    sched.songEnd = savedWeek.songEnd;
                    await transactionalEntityManager.save(MidweekSchedule_1.MidweekSchedule, sched);
                    if (sched.parts && sched.parts.length > 0) {
                        // Sincroniza cada seção de forma ordenada por posição relativa
                        for (const section of [MidweekWorkbookPart_1.MidweekSection.TREASURES, MidweekWorkbookPart_1.MidweekSection.MINISTRY, MidweekWorkbookPart_1.MidweekSection.LIVING]) {
                            const sectionWbParts = partsToInsert
                                .filter(wp => wp.section === section)
                                .sort((a, b) => a.orderIndex - b.orderIndex);
                            const sectionMainSchedParts = sched.parts
                                .filter(mp => mp.section === section && mp.room === MidweekMeetingPart_1.MidweekRoom.MAIN && mp.partType !== MidweekWorkbookPart_1.MidweekPartType.CUSTOM && !mp.title.toLowerCase().includes("discurso de serviço"))
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
                                    await transactionalEntityManager.save(MidweekMeetingPart_1.MidweekMeetingPart, schedPart);
                                }
                                // Atualiza também as salas auxiliares na mesma posição
                                const auxRooms = [MidweekMeetingPart_1.MidweekRoom.AUXILIARY_1, MidweekMeetingPart_1.MidweekRoom.AUXILIARY_2];
                                for (const room of auxRooms) {
                                    const roomParts = sched.parts
                                        .filter(mp => mp.section === section && mp.room === room && mp.partType !== MidweekWorkbookPart_1.MidweekPartType.CUSTOM)
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
                                        await transactionalEntityManager.save(MidweekMeetingPart_1.MidweekMeetingPart, auxPart);
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
    mapStudentPartType(typeName, isTalk) {
        const lower = typeName.toLowerCase();
        if (isTalk || lower.includes("discurso")) {
            return MidweekWorkbookPart_1.MidweekPartType.STUDENT_TALK;
        }
        if (lower.includes("iniciando conversas") || lower.includes("iniciar conversas") || lower.includes("primeira conversa")) {
            return MidweekWorkbookPart_1.MidweekPartType.INITIAL_CALL;
        }
        if (lower.includes("cultivando o interesse") || lower.includes("revisita")) {
            return MidweekWorkbookPart_1.MidweekPartType.RETURN_VISIT;
        }
        if (lower.includes("fazendo discípulos") || lower.includes("estudo bíblico")) {
            return MidweekWorkbookPart_1.MidweekPartType.BIBLE_STUDY;
        }
        if (lower.includes("explicando suas crenças")) {
            return MidweekWorkbookPart_1.MidweekPartType.EXPLAIN_BELIEFS;
        }
        return MidweekWorkbookPart_1.MidweekPartType.INITIAL_CALL;
    }
}
exports.MidweekXmlParserService = MidweekXmlParserService;
