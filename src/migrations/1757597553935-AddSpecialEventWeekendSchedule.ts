import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpecialEventWeekendSchedule1757597553935 implements MigrationInterface {
    name = 'AddSpecialEventWeekendSchedule1757597553935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "isSpecial" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "specialName" text`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "manualSpeaker" text`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "manualTalk" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "manualTalk"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "manualSpeaker"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "specialName"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "isSpecial"`);
    }

}
