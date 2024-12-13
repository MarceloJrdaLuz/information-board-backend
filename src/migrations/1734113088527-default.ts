import { MigrationInterface, QueryRunner } from "typeorm";

export class default1734113088527 implements MigrationInterface {
    name = 'default1734113088527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "territory_history" ADD "work_type" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "territory_history" DROP COLUMN "work_type"`);
    }

}
