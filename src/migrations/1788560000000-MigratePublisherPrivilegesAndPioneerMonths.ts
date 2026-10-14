import { MigrationInterface, QueryRunner } from "typeorm";
import { Publisher } from "../entities/Publisher";
import { Privilege } from "../entities/Privilege";
import { PublisherPrivilege } from "../entities/PublisherPrivilege";
import { parsePioneerMonthString, privilegePTtoEN } from "../helpers/privilegesTranslations";

export class MigratePublisherPrivilegesAndPioneerMonths1788560000000 implements MigrationInterface {
    name = "MigratePublisherPrivilegesAndPioneerMonths1788560000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const publisherRepo = queryRunner.manager.getRepository(Publisher);
        const privilegeRepo = queryRunner.manager.getRepository(Privilege);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege);

        const [publishers, allPrivileges] = await Promise.all([
            publisherRepo.find(),
            privilegeRepo.find()
        ]);

        const privilegeByName = new Map<string, Privilege>();
        for (const p of allPrivileges) {
            privilegeByName.set(p.name, p);
        }

        const auxPioneerPriv = privilegeByName.get("Auxiliary Pioneer");

        for (const publisher of publishers) {
            // 1. Migrate continuous privileges
            if (Array.isArray(publisher.privileges) && publisher.privileges.length > 0) {
                for (const rawPriv of publisher.privileges) {
                    const trimmed = rawPriv.trim();
                    const enName = privilegePTtoEN[trimmed] || trimmed;
                    const privEntity = privilegeByName.get(enName);

                    if (!privEntity) continue;

                    // Skip temporary monthly Auxiliary Pioneer here (handled via pioneerMonths)
                    if (enName === "Auxiliary Pioneer") continue;

                    const existing = await publisherPrivilegeRepo.findOne({
                        where: {
                            publisher: { id: publisher.id },
                            privilege: { id: privEntity.id },
                            endDate: null as any
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
                    const parsed = parsePioneerMonthString(pMonth);
                    if (!parsed) continue;

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

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Data migration rollback is a no-op to prevent unintentional data loss
    }
}
