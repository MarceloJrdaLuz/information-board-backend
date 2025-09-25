import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWatchtowerStudyTitleInWeekendSchedule1758628288117 implements MigrationInterface {
    name = 'AddWatchtowerStudyTitleInWeekendSchedule1758628288117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "watchTowerStudyTitle" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "watchTowerStudyTitle"`);
    }

}
