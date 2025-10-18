import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisitingCongregationIndWeekendSchedule1760797048383 implements MigrationInterface {
    name = 'AddVisitingCongregationIndWeekendSchedule1760797048383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "visiting_congregation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD CONSTRAINT "FK_b974c2da030070591f75f3e4d59" FOREIGN KEY ("visiting_congregation_id") REFERENCES "congregation"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP CONSTRAINT "FK_b974c2da030070591f75f3e4d59"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "visiting_congregation_id"`);
    }

}
