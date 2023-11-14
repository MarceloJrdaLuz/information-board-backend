import { MigrationInterface, QueryRunner } from "typeorm";

export class default1699897339259 implements MigrationInterface {
    name = 'default1699897339259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assistance" ADD "midWeekTotal" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assistance" ADD "midWeekAverage" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assistance" ADD "endWeekTotal" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assistance" ADD "endWeekAverage" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "endWeekAverage"`);
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "endWeekTotal"`);
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "midWeekAverage"`);
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "midWeekTotal"`);
    }

}
