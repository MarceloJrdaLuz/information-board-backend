"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanOrphanedAuxiliaryPioneerPrivileges1788572000000 = void 0;
const Publisher_1 = require("../entities/Publisher");
const PublisherPrivilege_1 = require("../entities/PublisherPrivilege");
const dayjs_1 = __importDefault(require("dayjs"));
class CleanOrphanedAuxiliaryPioneerPrivileges1788572000000 {
    constructor() {
        this.name = "CleanOrphanedAuxiliaryPioneerPrivileges1788572000000";
    }
    async up(queryRunner) {
        var _a, _b;
        const publisherRepo = queryRunner.manager.getRepository(Publisher_1.Publisher);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege_1.PublisherPrivilege);
        // 1. Encontra todos os registros de Auxiliary Pioneer com endDate null
        const allAuxPrivs = await publisherPrivilegeRepo.find({
            relations: ["privilege", "publisher"]
        });
        const openAuxPrivs = allAuxPrivs.filter(pp => {
            var _a, _b;
            return (((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Auxiliary Pioneer" || ((_b = pp.privilege) === null || _b === void 0 ? void 0 : _b.code) === "AUXILIARY_PIONEER") &&
                !pp.endDate;
        });
        for (const pp of openAuxPrivs) {
            // Se startDate for nulo ou inválido, é registro fantasma puro -> deletar
            if (!pp.startDate || !(0, dayjs_1.default)(pp.startDate).isValid()) {
                await publisherPrivilegeRepo.remove(pp);
            }
            else {
                // Se possui data de início (ex: 2023-07-01), define a data de término para o fim daquele mesmo mês
                const endOfMonth = (0, dayjs_1.default)(pp.startDate).endOf("month").toDate();
                pp.endDate = endOfMonth;
                await publisherPrivilegeRepo.save(pp);
            }
        }
        // 2. Limpa dados inconsistentes nos publicadores afetados
        const allPublishers = await publisherRepo.find({
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });
        for (const pub of allPublishers) {
            let updated = false;
            // Verifica se o publicador possui algum privilégio de pioneiro contínuo ativo
            const hasContinuousPioneerActive = (_a = pub.privilegesRelation) === null || _a === void 0 ? void 0 : _a.some(pp => {
                var _a, _b, _c, _d, _e, _f;
                return !pp.endDate &&
                    (((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Regular Pioneer" ||
                        ((_b = pp.privilege) === null || _b === void 0 ? void 0 : _b.name) === "Continuous Auxiliary Pioneer" ||
                        ((_c = pp.privilege) === null || _c === void 0 ? void 0 : _c.name) === "Special Pioneer" ||
                        ((_d = pp.privilege) === null || _d === void 0 ? void 0 : _d.code) === "REGULAR_PIONEER" ||
                        ((_e = pp.privilege) === null || _e === void 0 ? void 0 : _e.code) === "CONTINUOUS_AUXILIARY_PIONEER" ||
                        ((_f = pp.privilege) === null || _f === void 0 ? void 0 : _f.code) === "SPECIAL_PIONEER");
            });
            // Se tem startPioneer mas não é pioneiro contínuo ativo, limpa startPioneer
            if (pub.startPioneer && !hasContinuousPioneerActive) {
                pub.startPioneer = null;
                updated = true;
            }
            // Remove meses de pioneiro adicionados por engano (ex: Outubro-2026 para a Vânia)
            if (pub.fullName === "Erivânia Maria do Nascimento" && Array.isArray(pub.pioneerMonths)) {
                if (pub.pioneerMonths.includes("Outubro-2026")) {
                    pub.pioneerMonths = pub.pioneerMonths.filter(m => m !== "Outubro-2026");
                    updated = true;
                }
            }
            // Se o publicador não possui nenhum registro ativo de Pioneiro Auxiliar ou Contínuo,
            // remove "Pioneiro Auxiliar" do array legado de privileges
            const hasActiveAux = (_b = pub.privilegesRelation) === null || _b === void 0 ? void 0 : _b.some(pp => {
                var _a, _b;
                return (((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === "Auxiliary Pioneer" || ((_b = pp.privilege) === null || _b === void 0 ? void 0 : _b.code) === "AUXILIARY_PIONEER") &&
                    pp.startDate && pp.endDate &&
                    (0, dayjs_1.default)().isAfter((0, dayjs_1.default)(pp.startDate).startOf("day")) &&
                    (0, dayjs_1.default)().isBefore((0, dayjs_1.default)(pp.endDate).endOf("day"));
            });
            if (!hasActiveAux && !hasContinuousPioneerActive && Array.isArray(pub.privileges)) {
                if (pub.privileges.includes("Pioneiro Auxiliar")) {
                    pub.privileges = pub.privileges.filter(p => p !== "Pioneiro Auxiliar");
                    updated = true;
                }
            }
            if (updated) {
                await publisherRepo.save(pub);
            }
        }
    }
    async down(queryRunner) {
        // Rollback sem operação para evitar perda acidental de dados
    }
}
exports.CleanOrphanedAuxiliaryPioneerPrivileges1788572000000 = CleanOrphanedAuxiliaryPioneerPrivileges1788572000000;
