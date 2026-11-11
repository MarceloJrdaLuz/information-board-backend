"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedManagerRoles1789530000000 = void 0;
class SeedManagerRoles1789530000000 {
    constructor() {
        this.name = "SeedManagerRoles1789530000000";
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
        // Rollback opcional
    }
}
exports.SeedManagerRoles1789530000000 = SeedManagerRoles1789530000000;
