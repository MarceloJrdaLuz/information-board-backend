"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const data_source_1 = require("../../data-source");
const Congregation_1 = require("../../entities/Congregation");
const Speaker_1 = require("../../entities/Speaker");
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const speakerShareTokenRepository_1 = require("../../repositories/speakerShareTokenRepository");
const userRepository_1 = require("../../repositories/userRepository");
const permissions_1 = require("../../middlewares/permissions");
const normalizeStr = (str = "") => str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
class SpeakerShareController {
    /**
     * Gera ou retorna um código PIN ativo de 6 dígitos para a congregação logada compartilhar seus oradores.
     */
    async generateToken(req, res) {
        const requestUser = await (0, permissions_1.decoder)(req);
        const user = await userRepository_1.userRepository.findOne({
            where: { id: requestUser.id },
            relations: ["congregation"],
        });
        if (!(user === null || user === void 0 ? void 0 : user.congregation)) {
            throw new api_errors_1.BadRequestError("Usuário não possui congregação vinculada.");
        }
        const now = new Date();
        const forceNew = req.query.force === "true";
        // Verifica se já existe um token ativo e não expirado
        if (!forceNew) {
            const existingToken = await speakerShareTokenRepository_1.speakerShareTokenRepository.findOne({
                where: {
                    congregation: { id: user.congregation.id },
                    is_active: true,
                    expires_at: (0, typeorm_1.MoreThan)(now),
                },
                order: { created_at: "DESC" },
            });
            if (existingToken) {
                return res.status(200).json({
                    token: existingToken.token,
                    expires_at: existingToken.expires_at,
                    congregation: {
                        id: user.congregation.id,
                        name: user.congregation.name,
                    },
                });
            }
        }
        // Desativa tokens anteriores
        await speakerShareTokenRepository_1.speakerShareTokenRepository.update({ congregation: { id: user.congregation.id }, is_active: true }, { is_active: false });
        // Gera um PIN de 6 dígitos único
        let pin = "";
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            attempts++;
            pin = Math.floor(100000 + Math.random() * 900000).toString();
            const conflict = await speakerShareTokenRepository_1.speakerShareTokenRepository.findOne({
                where: { token: pin, is_active: true, expires_at: (0, typeorm_1.MoreThan)(now) },
            });
            if (!conflict)
                isUnique = true;
        }
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas de validade
        const newToken = speakerShareTokenRepository_1.speakerShareTokenRepository.create({
            token: pin,
            congregation: user.congregation,
            user,
            expires_at: expiresAt,
            is_active: true,
        });
        await speakerShareTokenRepository_1.speakerShareTokenRepository.save(newToken);
        return res.status(201).json({
            token: newToken.token,
            expires_at: newToken.expires_at,
            congregation: {
                id: user.congregation.id,
                name: user.congregation.name,
            },
        });
    }
    /**
     * Consulta o código PIN informado e retorna a prévia estruturada dos dados a importar,
     * identificando de forma inteligente a congregação de origem, as auxiliares e se alguma delas
     * é a própria congregação importadora (inversão de papéis).
     */
    async previewByToken(req, res) {
        const { token } = req.params;
        if (!token || !token.trim()) {
            throw new api_errors_1.BadRequestError("Código de compartilhamento é obrigatório.");
        }
        const cleanToken = token.trim().toUpperCase();
        const requestUser = await (0, permissions_1.decoder)(req);
        const user = await userRepository_1.userRepository.findOne({
            where: { id: requestUser.id },
            relations: ["congregation"],
        });
        if (!(user === null || user === void 0 ? void 0 : user.congregation)) {
            throw new api_errors_1.BadRequestError("Usuário não possui congregação vinculada.");
        }
        const tokenRecord = await speakerShareTokenRepository_1.speakerShareTokenRepository.findOne({
            where: {
                token: cleanToken,
                is_active: true,
                expires_at: (0, typeorm_1.MoreThan)(new Date()),
            },
            relations: ["congregation"],
        });
        if (!tokenRecord) {
            throw new api_errors_1.NotFoundError("Código de compartilhamento inválido ou expirado.");
        }
        const sourceCongregation = tokenRecord.congregation;
        if (sourceCongregation.id === user.congregation.id) {
            throw new api_errors_1.BadRequestError("Você não pode importar dados da sua própria congregação.");
        }
        // 1. Oradores cadastrados pela congregação de origem
        const sourceSpeakers = await speakerRepository_1.speakerRepository.find({
            where: { creatorCongregation: { id: sourceCongregation.id } },
            relations: ["originCongregation", "talks"],
            order: { fullName: "ASC" },
        });
        // 2. Congregações auxiliares cadastradas pela congregação de origem
        const sourceAuxCongregations = await congregationRepository_1.congregationRepository.find({
            where: {
                type: Congregation_1.CongregationType.AUXILIARY,
                creatorCongregation: { id: sourceCongregation.id },
            },
            order: { name: "ASC" },
        });
        // 3. Congregações auxiliares já cadastradas na congregação do usuário importador
        const myAuxCongregations = await congregationRepository_1.congregationRepository.find({
            where: {
                type: Congregation_1.CongregationType.AUXILIARY,
                creatorCongregation: { id: user.congregation.id },
            },
        });
        // 4. Oradores já cadastrados na congregação do usuário importador
        const mySpeakers = await speakerRepository_1.speakerRepository.find({
            where: { creatorCongregation: { id: user.congregation.id } },
            relations: ["originCongregation"],
        });
        const isMatchWithUserCongregation = (c) => {
            if (c.number && user.congregation.number && c.number === user.congregation.number)
                return true;
            const sameName = normalizeStr(c.name) === normalizeStr(user.congregation.name);
            const sameCity = normalizeStr(c.city) === normalizeStr(user.congregation.city);
            const sameCircuit = normalizeStr(c.circuit) === normalizeStr(user.congregation.circuit);
            return sameName && (sameCity || sameCircuit);
        };
        const isExistingInMyAux = (c) => {
            return myAuxCongregations.some((myAux) => {
                if (c.number && myAux.number && c.number === myAux.number)
                    return true;
                const sameName = normalizeStr(c.name) === normalizeStr(myAux.name);
                const sameCity = normalizeStr(c.city) === normalizeStr(myAux.city);
                return sameName && sameCity;
            });
        };
        const groups = [];
        // GRUPO 1: A congregação exportadora (ex: Luís Gomes)
        // Para o importador, ela será adicionada como Congregação Auxiliar visitante
        const sourceLocalSpeakers = sourceSpeakers.filter((s) => { var _a; return ((_a = s.originCongregation) === null || _a === void 0 ? void 0 : _a.id) === sourceCongregation.id; });
        groups.push({
            groupKey: `source_${sourceCongregation.id}`,
            congregationName: sourceCongregation.name,
            city: sourceCongregation.city,
            circuit: sourceCongregation.circuit,
            number: sourceCongregation.number,
            address: sourceCongregation.address,
            dayMeetingPublic: sourceCongregation.dayMeetingPublic,
            hourMeetingPublic: sourceCongregation.hourMeetingPublic,
            isSource: true,
            isTargetLocal: false,
            alreadyExists: isExistingInMyAux(sourceCongregation),
            speakers: sourceLocalSpeakers.map((s) => {
                var _a, _b;
                return ({
                    id: s.id,
                    fullName: s.fullName,
                    phone: s.phone,
                    address: s.address,
                    talksCount: ((_a = s.talks) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    talks: ((_b = s.talks) === null || _b === void 0 ? void 0 : _b.map((t) => ({ id: t.id, number: t.number, title: t.title }))) || [],
                    alreadyExistsInMyList: mySpeakers.some((ms) => normalizeStr(ms.fullName) === normalizeStr(s.fullName)),
                });
            }),
        });
        // GRUPO 2: As congregações auxiliares cadastradas no exportador
        for (const aux of sourceAuxCongregations) {
            const isTargetLocal = isMatchWithUserCongregation(aux);
            const auxSpeakers = sourceSpeakers.filter((s) => { var _a; return ((_a = s.originCongregation) === null || _a === void 0 ? void 0 : _a.id) === aux.id; });
            groups.push({
                groupKey: `aux_${aux.id}`,
                congregationName: aux.name,
                city: aux.city,
                circuit: aux.circuit,
                number: aux.number,
                address: aux.address,
                dayMeetingPublic: aux.dayMeetingPublic,
                hourMeetingPublic: aux.hourMeetingPublic,
                isSource: false,
                isTargetLocal,
                alreadyExists: !isTargetLocal && isExistingInMyAux(aux),
                speakers: auxSpeakers.map((s) => {
                    var _a, _b;
                    return ({
                        id: s.id,
                        fullName: s.fullName,
                        phone: s.phone,
                        address: s.address,
                        talksCount: ((_a = s.talks) === null || _a === void 0 ? void 0 : _a.length) || 0,
                        talks: ((_b = s.talks) === null || _b === void 0 ? void 0 : _b.map((t) => ({ id: t.id, number: t.number, title: t.title }))) || [],
                        alreadyExistsInMyList: mySpeakers.some((ms) => normalizeStr(ms.fullName) === normalizeStr(s.fullName)),
                    });
                }),
            });
        }
        // Ordena: primeiro a congregação local do usuário (se houver), depois o exportador, depois os outros auxiliares
        groups.sort((a, b) => {
            if (a.isTargetLocal)
                return -1;
            if (b.isTargetLocal)
                return 1;
            if (a.isSource)
                return -1;
            if (b.isSource)
                return 1;
            return a.congregationName.localeCompare(b.congregationName);
        });
        return res.status(200).json({
            token: tokenRecord.token,
            expires_at: tokenRecord.expires_at,
            sourceCongregation: {
                id: sourceCongregation.id,
                name: sourceCongregation.name,
                city: sourceCongregation.city,
                circuit: sourceCongregation.circuit,
            },
            userCongregation: {
                id: user.congregation.id,
                name: user.congregation.name,
                city: user.congregation.city,
            },
            groups,
        });
    }
    /**
     * Executa a importação dos grupos e oradores selecionados dentro de uma transação.
     */
    async importByToken(req, res) {
        const { token, selectedGroupKeys, selectedSpeakerIds } = req.body;
        if (!token || !token.trim()) {
            throw new api_errors_1.BadRequestError("Código de compartilhamento é obrigatório.");
        }
        if (!Array.isArray(selectedGroupKeys) || selectedGroupKeys.length === 0) {
            throw new api_errors_1.BadRequestError("Selecione pelo menos uma congregação para importar.");
        }
        const cleanToken = token.trim().toUpperCase();
        const requestUser = await (0, permissions_1.decoder)(req);
        const user = await userRepository_1.userRepository.findOne({
            where: { id: requestUser.id },
            relations: ["congregation"],
        });
        if (!(user === null || user === void 0 ? void 0 : user.congregation)) {
            throw new api_errors_1.BadRequestError("Usuário não possui congregação vinculada.");
        }
        const tokenRecord = await speakerShareTokenRepository_1.speakerShareTokenRepository.findOne({
            where: {
                token: cleanToken,
                is_active: true,
                expires_at: (0, typeorm_1.MoreThan)(new Date()),
            },
            relations: ["congregation"],
        });
        if (!tokenRecord) {
            throw new api_errors_1.NotFoundError("Código de compartilhamento inválido ou expirado.");
        }
        const sourceCongregation = tokenRecord.congregation;
        if (sourceCongregation.id === user.congregation.id) {
            throw new api_errors_1.BadRequestError("Você não pode importar dados da sua própria congregação.");
        }
        // Executa tudo dentro de uma transação do TypeORM
        const result = await data_source_1.AppDataSource.manager.transaction(async (manager) => {
            var _a;
            let importedCongregationsCount = 0;
            let importedSpeakersCount = 0;
            let updatedSpeakersCount = 0;
            // 1. Carrega todos os oradores da congregação de origem com seus discursos
            const allSourceSpeakers = await manager.getRepository(Speaker_1.Speaker).find({
                where: { creatorCongregation: { id: sourceCongregation.id } },
                relations: ["originCongregation", "talks"],
            });
            // 2. Carrega congregações auxiliares da congregação de origem
            const allSourceAuxCongregations = await manager.getRepository(Congregation_1.Congregation).find({
                where: {
                    type: Congregation_1.CongregationType.AUXILIARY,
                    creatorCongregation: { id: sourceCongregation.id },
                },
            });
            // 3. Carrega auxiliares já existentes do usuário para evitar duplicação
            const existingMyAux = await manager.getRepository(Congregation_1.Congregation).find({
                where: {
                    type: Congregation_1.CongregationType.AUXILIARY,
                    creatorCongregation: { id: user.congregation.id },
                },
            });
            // Helper para encontrar ou criar a congregação auxiliar de destino
            const getOrCreateAux = async (ref) => {
                var _a;
                const found = existingMyAux.find((ea) => {
                    if (ref.number && ea.number && ref.number === ea.number)
                        return true;
                    return normalizeStr(ea.name) === normalizeStr(ref.name) && normalizeStr(ea.city) === normalizeStr(ref.city);
                });
                if (found)
                    return found;
                // Gera número auxiliar único se não houver
                let auxNumber = ((_a = ref.number) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                if (!auxNumber) {
                    auxNumber = `AUX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
                }
                else {
                    // Garante unicidade caso já exista alguma congregação com esse número
                    const numberConflict = await manager.getRepository(Congregation_1.Congregation).findOne({
                        where: { number: auxNumber },
                    });
                    if (numberConflict) {
                        auxNumber = `AUX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
                    }
                }
                const newAux = manager.getRepository(Congregation_1.Congregation).create({
                    name: ref.name,
                    number: auxNumber,
                    city: ref.city || user.congregation.city || "",
                    circuit: ref.circuit || user.congregation.circuit || "",
                    address: ref.address || undefined,
                    dayMeetingPublic: ref.dayMeetingPublic || undefined,
                    hourMeetingPublic: ref.hourMeetingPublic || undefined,
                    type: Congregation_1.CongregationType.AUXILIARY,
                    creatorCongregation: user.congregation,
                });
                await manager.getRepository(Congregation_1.Congregation).save(newAux);
                existingMyAux.push(newAux);
                importedCongregationsCount++;
                return newAux;
            };
            const speakerFilterSet = selectedSpeakerIds && Array.isArray(selectedSpeakerIds) && selectedSpeakerIds.length > 0
                ? new Set(selectedSpeakerIds)
                : null;
            for (const groupKey of selectedGroupKeys) {
                let destOriginCongregation;
                let speakersToImport = [];
                if (groupKey === `source_${sourceCongregation.id}`) {
                    // Congregação de Origem (Luís Gomes) -> Vira congregação auxiliar para o importador
                    destOriginCongregation = await getOrCreateAux({
                        name: sourceCongregation.name,
                        number: sourceCongregation.number,
                        city: sourceCongregation.city,
                        circuit: sourceCongregation.circuit,
                        address: sourceCongregation.address,
                        dayMeetingPublic: sourceCongregation.dayMeetingPublic,
                        hourMeetingPublic: sourceCongregation.hourMeetingPublic,
                    });
                    speakersToImport = allSourceSpeakers.filter((s) => { var _a; return ((_a = s.originCongregation) === null || _a === void 0 ? void 0 : _a.id) === sourceCongregation.id; });
                }
                else if (groupKey.startsWith("aux_")) {
                    const auxId = groupKey.replace("aux_", "");
                    const sourceAux = allSourceAuxCongregations.find((a) => a.id === auxId);
                    if (!sourceAux)
                        continue;
                    // Verifica se essa congregação auxiliar corresponde à própria congregação do usuário importador
                    const isTargetLocal = (sourceAux.number && user.congregation.number && sourceAux.number === user.congregation.number) ||
                        (normalizeStr(sourceAux.name) === normalizeStr(user.congregation.name) &&
                            normalizeStr(sourceAux.city) === normalizeStr(user.congregation.city));
                    if (isTargetLocal) {
                        // É a própria congregação do usuário! Oradores ficam com originCongregation = própria congregação
                        destOriginCongregation = user.congregation;
                    }
                    else {
                        // Congregação de terceiros -> Garante ou cria como auxiliar para o importador
                        destOriginCongregation = await getOrCreateAux({
                            name: sourceAux.name,
                            number: sourceAux.number,
                            city: sourceAux.city,
                            circuit: sourceAux.circuit,
                            address: sourceAux.address,
                            dayMeetingPublic: sourceAux.dayMeetingPublic,
                            hourMeetingPublic: sourceAux.hourMeetingPublic,
                        });
                    }
                    speakersToImport = allSourceSpeakers.filter((s) => { var _a; return ((_a = s.originCongregation) === null || _a === void 0 ? void 0 : _a.id) === sourceAux.id; });
                }
                else {
                    continue;
                }
                // Importa ou atualiza cada orador selecionado
                for (const spk of speakersToImport) {
                    if (speakerFilterSet && !speakerFilterSet.has(spk.id)) {
                        continue; // Usuário desmarcou esse orador
                    }
                    // Verifica se já existe um orador com mesmo nome nessa mesma congregação de origem
                    let existingSpeaker = await manager.getRepository(Speaker_1.Speaker).findOne({
                        where: {
                            fullName: spk.fullName.trim(),
                            creatorCongregation: { id: user.congregation.id },
                            originCongregation: { id: destOriginCongregation.id },
                        },
                        relations: ["talks"],
                    });
                    if (existingSpeaker) {
                        // Mescla novos discursos se houver
                        const existingTalkIds = new Set(((_a = existingSpeaker.talks) === null || _a === void 0 ? void 0 : _a.map((t) => t.id)) || []);
                        const newTalks = (spk.talks || []).filter((t) => !existingTalkIds.has(t.id));
                        let changed = false;
                        if (newTalks.length > 0) {
                            existingSpeaker.talks = [...(existingSpeaker.talks || []), ...newTalks];
                            changed = true;
                        }
                        if (!existingSpeaker.phone && spk.phone) {
                            existingSpeaker.phone = spk.phone;
                            changed = true;
                        }
                        if (!existingSpeaker.address && spk.address) {
                            existingSpeaker.address = spk.address;
                            changed = true;
                        }
                        if (changed) {
                            await manager.getRepository(Speaker_1.Speaker).save(existingSpeaker);
                            updatedSpeakersCount++;
                        }
                    }
                    else {
                        // Cria novo orador
                        const newSpeaker = manager.getRepository(Speaker_1.Speaker).create({
                            fullName: spk.fullName.trim(),
                            phone: spk.phone || undefined,
                            address: spk.address || undefined,
                            creatorCongregation: user.congregation,
                            originCongregation: destOriginCongregation,
                            publisher: null,
                            talks: spk.talks || [],
                        });
                        await manager.getRepository(Speaker_1.Speaker).save(newSpeaker);
                        importedSpeakersCount++;
                    }
                }
            }
            return {
                importedCongregationsCount,
                importedSpeakersCount,
                updatedSpeakersCount,
            };
        });
        return res.status(200).json({
            success: true,
            message: "Importação concluída com sucesso!",
            ...result,
        });
    }
}
exports.default = new SpeakerShareController();
