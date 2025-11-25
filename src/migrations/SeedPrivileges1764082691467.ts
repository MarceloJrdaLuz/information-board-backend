import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedPrivileges1764082691467 implements MigrationInterface {
    name = "SeedPrivileges1764082691467";

    public async up(queryRunner: QueryRunner): Promise<void> {
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM privileges
            WHERE name IN (
                'Field Conductor'
            );
        `);
    }
}
