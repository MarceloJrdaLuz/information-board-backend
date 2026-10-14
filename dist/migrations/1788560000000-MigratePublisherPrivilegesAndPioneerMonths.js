"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigratePublisherPrivilegesAndPioneerMonths1788560000000 = void 0;
const Publisher_1 = require("../entities/Publisher");
const Privilege_1 = require("../entities/Privilege");
const PublisherPrivilege_1 = require("../entities/PublisherPrivilege");
const privilegesTranslations_1 = require("../helpers/privilegesTranslations");
class MigratePublisherPrivilegesAndPioneerMonths1788560000000 {
    constructor() {
        this.name = "MigratePublisherPrivilegesAndPioneerMonths1788560000000";
    }
    async up(queryRunner) {
        const publisherRepo = queryRunner.manager.getRepository(Publisher_1.Publisher);
        const privilegeRepo = queryRunner.manager.getRepository(Privilege_1.Privilege);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege_1.PublisherPrivilege);
        const [publishers, allPrivileges] = await Promise.all([
            publisherRepo.find(),
            privilegeRepo.find()
        ]);
        const privilegeByName = new Map();
        for (const p of allPrivileges) {
            privilegeByName.set(p.name, p);
        }
        const auxPioneerPriv = privilegeByName.get("Auxiliary Pioneer");
        for (const publisher of publishers) {
            // 1. Migrate continuous privileges
            if (Array.isArray(publisher.privileges) && publisher.privileges.length > 0) {
                for (const rawPriv of publisher.privileges) {
                    const trimmed = rawPriv.trim();
                    const enName = privilegesTranslations_1.privilegePTtoEN[trimmed] || trimmed;
                    const privEntity = privilegeByName.get(enName);
                    if (!privEntity)
                        continue;
                    // Skip temporary monthly Auxiliary Pioneer here (handled via pioneerMonths)
                    if (enName === "Auxiliary Pioneer")
                        continue;
                    const existing = await publisherPrivilegeRepo.findOne({
                        where: {
                            publisher: { id: publisher.id },
                            privilege: { id: privEntity.id },
                            endDate: null
                        }
                    });
                    if (!existing) {
                        const isPioneerRole = enName === "Regular Pioneer" || enName === "Continuous Auxiliary Pioneer";
                        const startDate = isPioneerRole && publisher.startPioneer ? new Date(publisher.startPioneer) : null;
                        await publisherPrivilegeRepo.save({
                            publisher,
                            privilege: privEntity,
                            startDate,
                            endDate: null
                        });
                    }
                }
            }
            // 2. Migrate discrete monthly auxiliary pioneer records
            if (auxPioneerPriv && Array.isArray(publisher.pioneerMonths) && publisher.pioneerMonths.length > 0) {
                for (const pMonth of publisher.pioneerMonths) {
                    const parsed = (0, privilegesTranslations_1.parsePioneerMonthString)(pMonth);
                    if (!parsed)
                        continue;
                    const startDate = new Date(parsed.startDate);
                    const endDate = new Date(parsed.endDate);
                    const existingMonth = await publisherPrivilegeRepo.findOne({
                        where: {
                            publisher: { id: publisher.id },
                            privilege: { id: auxPioneerPriv.id },
                            startDate,
                            endDate
                        }
                    });
                    if (!existingMonth) {
                        await publisherPrivilegeRepo.save({
                            publisher,
                            privilege: auxPioneerPriv,
                            startDate,
                            endDate
                        });
                    }
                }
            }
        }
    }
    async down(queryRunner) {
        // Data migration rollback is a no-op to prevent unintentional data loss
    }
}
exports.MigratePublisherPrivilegesAndPioneerMonths1788560000000 = MigratePublisherPrivilegesAndPioneerMonths1788560000000;
