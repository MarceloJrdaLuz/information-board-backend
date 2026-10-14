import { MigrationInterface, QueryRunner } from "typeorm";
import { Publisher } from "../entities/Publisher";
import { PublisherPrivilege } from "../entities/PublisherPrivilege";
import dayjs from "dayjs";

export class CleanOrphanedAuxiliaryPioneerPrivileges1788572000000 implements MigrationInterface {
    name = "CleanOrphanedAuxiliaryPioneerPrivileges1788572000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const publisherRepo = queryRunner.manager.getRepository(Publisher);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege);

        // 1. Encontra todos os registros de Auxiliary Pioneer com endDate null
        const allAuxPrivs = await publisherPrivilegeRepo.find({
            relations: ["privilege", "publisher"]
        });

        const openAuxPrivs = allAuxPrivs.filter(pp =>
            (pp.privilege?.name === "Auxiliary Pioneer" || pp.privilege?.code === "AUXILIARY_PIONEER") &&
            !pp.endDate
        );

        for (const pp of openAuxPrivs) {
            // Se startDate for nulo ou inválido, é registro fantasma puro -> deletar
            if (!pp.startDate || !dayjs(pp.startDate).isValid()) {
                await publisherPrivilegeRepo.remove(pp);
            } else {
                // Se possui data de início (ex: 2023-07-01), define a data de término para o fim daquele mesmo mês
                const endOfMonth = dayjs(pp.startDate).endOf("month").toDate();
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
            const hasContinuousPioneerActive = pub.privilegesRelation?.some(pp =>
                !pp.endDate &&
                (pp.privilege?.name === "Regular Pioneer" ||
                 pp.privilege?.name === "Continuous Auxiliary Pioneer" ||
                 pp.privilege?.name === "Special Pioneer" ||
                 pp.privilege?.code === "REGULAR_PIONEER" ||
                 pp.privilege?.code === "CONTINUOUS_AUXILIARY_PIONEER" ||
                 pp.privilege?.code === "SPECIAL_PIONEER")
            );

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
            const hasActiveAux = pub.privilegesRelation?.some(pp =>
                (pp.privilege?.name === "Auxiliary Pioneer" || pp.privilege?.code === "AUXILIARY_PIONEER") &&
                pp.startDate && pp.endDate &&
                dayjs().isAfter(dayjs(pp.startDate).startOf("day")) &&
                dayjs().isBefore(dayjs(pp.endDate).endOf("day"))
            );

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

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback sem operação para evitar perda acidental de dados
    }
}

