"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedPrivileges1764082691467 = void 0;
class SeedPrivileges1764082691467 {
    constructor() {
        this.name = "SeedPrivileges1764082691467";
    }
    async up(queryRunner) {
        // Garantir que a extensão de UUID existe
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
        // Inserir registros sem duplicar
        await queryRunner.query(`
            INSERT INTO privileges (id, name, created_at, updated_at)
            VALUES 
                (uuid_generate_v4(), 'Field Conductor', NOW(), NOW())
            ON CONFLICT (name) DO NOTHING;
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            DELETE FROM privileges
            WHERE name IN (
                'Field Conductor'
            );
        `);
    }
}
exports.SeedPrivileges1764082691467 = SeedPrivileges1764082691467;
