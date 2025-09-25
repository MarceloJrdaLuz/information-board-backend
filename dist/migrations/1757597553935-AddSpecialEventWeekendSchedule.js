"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSpecialEventWeekendSchedule1757597553935 = void 0;
class AddSpecialEventWeekendSchedule1757597553935 {
    constructor() {
        this.name = 'AddSpecialEventWeekendSchedule1757597553935';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "isSpecial" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "specialName" text`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "manualSpeaker" text`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "manualTalk" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "manualTalk"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "manualSpeaker"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "specialName"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "isSpecial"`);
    }
}
exports.AddSpecialEventWeekendSchedule1757597553935 = AddSpecialEventWeekendSchedule1757597553935;
