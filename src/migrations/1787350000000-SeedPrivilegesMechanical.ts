import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedPrivilegesMechanical1787350000000 implements MigrationInterface {
    name = "SeedPrivilegesMechanical1787350000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
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

    public async down(queryRunner: QueryRunner): Promise<void> {
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

