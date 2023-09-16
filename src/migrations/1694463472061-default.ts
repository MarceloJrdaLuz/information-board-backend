import { MigrationInterface, QueryRunner } from "typeorm";

export class default1694463472061 implements MigrationInterface {
    name = 'default1694463472061'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" ADD "startDay" integer`);
        await queryRunner.query(`ALTER TABLE "notices" ADD "endDay" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "endDay"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "startDay"`);
    }

}
