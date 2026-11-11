import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedManagerRoles1789530000000 implements MigrationInterface {
    name = "SeedManagerRoles1789530000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const roles = [
            { name: "CLEANING_MANAGER", description: "Gerenciador de Limpeza" },
            { name: "TALK_MANAGER", description: "Gerenciador de Discursos" },
            { name: "MIDWEEK_MANAGER", description: "Gerenciador de Reunião Meio de Semana" },
            { name: "FIELD_SERVICE_MANAGER", description: "Gerenciador de Campo" },
            { name: "PUBLIC_WITNESS_MANAGER", description: "Gerenciador de Testemunho Público" }
        ];

        for (const role of roles) {
            await queryRunner.query(`
                INSERT INTO "roles" ("name", "description")
                SELECT '${role.name}', '${role.description}'
                WHERE NOT EXISTS (
                    SELECT 1 FROM "roles" WHERE "name" = '${role.name}'
                );
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback opcional
    }
}
