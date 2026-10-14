"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestorePublisherPrivilegeForActivePublishers1788571000000 = void 0;
const Publisher_1 = require("../entities/Publisher");
const Privilege_1 = require("../entities/Privilege");
const PublisherPrivilege_1 = require("../entities/PublisherPrivilege");
class RestorePublisherPrivilegeForActivePublishers1788571000000 {
    constructor() {
        this.name = "RestorePublisherPrivilegeForActivePublishers1788571000000";
    }
    async up(queryRunner) {
        var _a, _b, _c, _d;
        const publisherRepo = queryRunner.manager.getRepository(Publisher_1.Publisher);
        const privilegeRepo = queryRunner.manager.getRepository(Privilege_1.Privilege);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege_1.PublisherPrivilege);
        // 1. Localiza a entidade do privilégio PUBLISHER
        const publisherPriv = await privilegeRepo.findOne({
            where: [
                { code: "PUBLISHER" },
                { name: "Publisher" },
                { name: "Publicador" }
            ]
        });
        if (!publisherPriv)
            return;
        // 2. Carrega todos os publicadores com seus privilégios relacionados
        const publishers = await publisherRepo.find({
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });
        for (const publisher of publishers) {
            // Ignora desassociados e removidos
            if (publisher.situation === Publisher_1.Situation.Desassociado || publisher.situation === Publisher_1.Situation.Removido) {
                continue;
            }
            const activePublisherPriv = (_a = publisher.privilegesRelation) === null || _a === void 0 ? void 0 : _a.find(pp => { var _a; return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.id) === publisherPriv.id && !pp.endDate; });
            // Se já tem PUBLISHER ativo, garante apenas que o array privileges contenha "Publicador" se não for estudante
            if (activePublisherPriv) {
                if (publisher.privileges && !publisher.privileges.includes("Publicador")) {
                    publisher.privileges = ["Publicador", ...publisher.privileges];
                    await publisherRepo.save(publisher);
                }
                continue;
            }
            // Verifica se a pessoa é pioneiro ou possui privilégios que exigem ser publicador
            const hasOtherActivePrivileges = (_b = publisher.privilegesRelation) === null || _b === void 0 ? void 0 : _b.some(pp => { var _a; return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.id) !== publisherPriv.id && !pp.endDate; });
            const hasPioneerStart = !!publisher.startPioneer;
            const hadPublisherInArray = ((_c = publisher.privileges) === null || _c === void 0 ? void 0 : _c.includes("Publicador")) || (publisher.privileges && publisher.privileges.length > 0);
            // Se a pessoa tem outros privilégios ativos, data de início de pioneiro ou já era publicador
            if (hasOtherActivePrivileges || hasPioneerStart || hadPublisherInArray) {
                // Se existe registro de PUBLISHER encerrado, reabre-o
                const closedPublisherPriv = (_d = publisher.privilegesRelation) === null || _d === void 0 ? void 0 : _d.find(pp => { var _a; return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.id) === publisherPriv.id && pp.endDate; });
                if (closedPublisherPriv) {
                    closedPublisherPriv.endDate = null;
                    await publisherPrivilegeRepo.save(closedPublisherPriv);
                }
                else {
                    await publisherPrivilegeRepo.save({
                        publisher,
                        privilege: publisherPriv,
                        startDate: null,
                        endDate: null
                    });
                }
                if (publisher.privileges && !publisher.privileges.includes("Publicador")) {
                    publisher.privileges = ["Publicador", ...publisher.privileges];
                    await publisherRepo.save(publisher);
                }
            }
        }
    }
    async down(queryRunner) {
    }
}
exports.RestorePublisherPrivilegeForActivePublishers1788571000000 = RestorePublisherPrivilegeForActivePublishers1788571000000;
