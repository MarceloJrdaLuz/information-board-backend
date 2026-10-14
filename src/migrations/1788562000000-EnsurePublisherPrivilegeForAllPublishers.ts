import { MigrationInterface, QueryRunner } from "typeorm";
import { Publisher } from "../entities/Publisher";
import { Privilege } from "../entities/Privilege";
import { PublisherPrivilege } from "../entities/PublisherPrivilege";

export class EnsurePublisherPrivilegeForAllPublishers1788562000000 implements MigrationInterface {
    name = "EnsurePublisherPrivilegeForAllPublishers1788562000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const publisherRepo = queryRunner.manager.getRepository(Publisher);
        const privilegeRepo = queryRunner.manager.getRepository(Privilege);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege);

        // 1. Locate or ensure the PUBLISHER privilege exists
        let publisherPriv = await privilegeRepo.findOne({
            where: [
                { code: "PUBLISHER" },
                { name: "Publisher" },
                { name: "Publicador" }
            ]
        });

        if (!publisherPriv) {
            publisherPriv = await privilegeRepo.save({
                code: "PUBLISHER",
                name: "Publisher"
            });
        }

        // 2. Load all existing publishers
        const publishers = await publisherRepo.find();

        // 3. For each publisher, ensure they have the PUBLISHER privilege recorded
        for (const publisher of publishers) {
            const existing = await publisherPrivilegeRepo.findOne({
                where: {
                    publisher: { id: publisher.id },
                    privilege: { id: publisherPriv.id },
                    endDate: null as any
                }
            });

            if (!existing) {
                await publisherPrivilegeRepo.save({
                    publisher,
                    privilege: publisherPriv,
                    startDate: null,
                    endDate: null
                });
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
