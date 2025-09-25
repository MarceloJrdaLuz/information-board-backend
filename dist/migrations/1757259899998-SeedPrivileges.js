"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedPrivileges1757259899998 = void 0;
class SeedPrivileges1757259899998 {
    constructor() {
        this.name = "SeedPrivileges1757259899998";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            INSERT INTO privileges (id, name, created_at, updated_at)
            VALUES 
                (uuid_generate_v4(), 'Publisher', NOW(), NOW()),
                (uuid_generate_v4(), 'Elder', NOW(), NOW()),
                (uuid_generate_v4(), 'Ministerial Servant', NOW(), NOW()),
                (uuid_generate_v4(), 'Regular Pioneer', NOW(), NOW()),
                (uuid_generate_v4(), 'Continuous Auxiliary Pioneer', NOW(), NOW()),
                (uuid_generate_v4(), 'Auxiliary Pioneer', NOW(), NOW()),
                (uuid_generate_v4(), 'Speaker', NOW(), NOW()),
                (uuid_generate_v4(), 'Reader', NOW(), NOW()),
                (uuid_generate_v4(), 'Chairman', NOW(), NOW()),
                (uuid_generate_v4(), 'Attendant', NOW(), NOW()),
                (uuid_generate_v4(), 'Microphone Attendant', NOW(), NOW()),
                (uuid_generate_v4(), 'Special Pioneer', NOW(), NOW()),
                (uuid_generate_v4(), 'Missionary Worldwide', NOW(), NOW())
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            DELETE FROM privileges
            WHERE name IN (
                'Publisher',
                'Elder',
                'Ministerial Servant',
                'Regular Pioneer',
                'Continuous Auxiliary Pioneer',
                'Auxiliary Pioneer',
                'Speaker',
                'Reader',
                'Chairman',
                'Attendant',
                'Microphone Attendant',
                'Special Pioneer',
                'Missionary Worldwide'
            );
        `);
    }
}
exports.SeedPrivileges1757259899998 = SeedPrivileges1757259899998;
