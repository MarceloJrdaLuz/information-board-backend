import { MigrationInterface, QueryRunner } from "typeorm";
import { Publisher, Situation } from "../entities/Publisher";
import { Privilege } from "../entities/Privilege";
import { PublisherPrivilege } from "../entities/PublisherPrivilege";

export class RestorePublisherPrivilegeForActivePublishers1788571000000 implements MigrationInterface {
    name = "RestorePublisherPrivilegeForActivePublishers1788571000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const publisherRepo = queryRunner.manager.getRepository(Publisher);
        const privilegeRepo = queryRunner.manager.getRepository(Privilege);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege);

        // 1. Localiza a entidade do privilégio PUBLISHER
        const publisherPriv = await privilegeRepo.findOne({
            where: [
                { code: "PUBLISHER" },
                { name: "Publisher" },
                { name: "Publicador" }
            ]
        });

        if (!publisherPriv) return;

        // 2. Carrega todos os publicadores com seus privilégios relacionados
        const publishers = await publisherRepo.find({
            relations: ["privilegesRelation", "privilegesRelation.privilege"]
        });

        for (const publisher of publishers) {
            // Ignora desassociados e removidos
            if (publisher.situation === Situation.Desassociado || publisher.situation === Situation.Removido) {
                continue;
            }

            const activePublisherPriv = publisher.privilegesRelation?.find(pp =>
                pp.privilege?.id === publisherPriv.id && !pp.endDate
            );

            // Se já tem PUBLISHER ativo, garante apenas que o array privileges contenha "Publicador" se não for estudante
            if (activePublisherPriv) {
                if (publisher.privileges && !publisher.privileges.includes("Publicador")) {
                    publisher.privileges = ["Publicador", ...publisher.privileges];
                    await publisherRepo.save(publisher);
                }
                continue;
            }

            // Verifica se a pessoa é pioneiro ou possui privilégios que exigem ser publicador
            const hasOtherActivePrivileges = publisher.privilegesRelation?.some(pp =>
                pp.privilege?.id !== publisherPriv.id && !pp.endDate
            );
            const hasPioneerStart = !!publisher.startPioneer;
            const hadPublisherInArray = publisher.privileges?.includes("Publicador") || (publisher.privileges && publisher.privileges.length > 0);

            // Se a pessoa tem outros privilégios ativos, data de início de pioneiro ou já era publicador
            if (hasOtherActivePrivileges || hasPioneerStart || hadPublisherInArray) {
                // Se existe registro de PUBLISHER encerrado, reabre-o
                const closedPublisherPriv = publisher.privilegesRelation?.find(pp =>
                    pp.privilege?.id === publisherPriv.id && pp.endDate
                );

                if (closedPublisherPriv) {
                    closedPublisherPriv.endDate = null;
                    await publisherPrivilegeRepo.save(closedPublisherPriv);
                } else {
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

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

