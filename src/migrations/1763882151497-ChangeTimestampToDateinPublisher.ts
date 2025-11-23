import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTimestampToDateinPublisher1763882151497 implements MigrationInterface {
    name = 'ChangeTimestampToDateinPublisher1763882151497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // dateImmersed
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "dateImmersed"
      TYPE DATE
      USING ("dateImmersed" AT TIME ZONE 'America/Sao_Paulo')::date;
    `);

        // birthDate
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "birthDate"
      TYPE DATE
      USING ("birthDate" AT TIME ZONE 'America/Sao_Paulo')::date;
    `);

        // startPioneer
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "startPioneer"
      TYPE DATE
      USING ("startPioneer" AT TIME ZONE 'America/Sao_Paulo')::date;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "dateImmersed"
      TYPE TIMESTAMP;
    `);

        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "birthDate"
      TYPE TIMESTAMP;
    `);

        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "startPioneer"
      TYPE TIMESTAMP;
    `);
    }
}
