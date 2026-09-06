"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedPrivilegesMechanical1787350000000 = void 0;
class SeedPrivilegesMechanical1787350000000 {
    constructor() {
        this.name = "SeedPrivilegesMechanical1787350000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
        await queryRunner.query(`
            INSERT INTO privileges (id, name, created_at, updated_at)
            VALUES 
                (uuid_generate_v4(), 'Sound', NOW(), NOW()),
                (uuid_generate_v4(), 'Media', NOW(), NOW()),
                (uuid_generate_v4(), 'Sound and Media', NOW(), NOW()),
                (uuid_generate_v4(), 'Stage Attendant', NOW(), NOW())
            ON CONFLICT (name) DO NOTHING;
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            DELETE FROM privileges
            WHERE name IN (
                'Sound',
                'Media',
                'Sound and Media',
                'Stage Attendant'
            );
        `);
    }
}
exports.SeedPrivilegesMechanical1787350000000 = SeedPrivilegesMechanical1787350000000;
