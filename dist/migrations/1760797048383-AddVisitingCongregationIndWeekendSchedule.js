"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVisitingCongregationIndWeekendSchedule1760797048383 = void 0;
class AddVisitingCongregationIndWeekendSchedule1760797048383 {
    constructor() {
        this.name = 'AddVisitingCongregationIndWeekendSchedule1760797048383';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "visiting_congregation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD CONSTRAINT "FK_b974c2da030070591f75f3e4d59" FOREIGN KEY ("visiting_congregation_id") REFERENCES "congregation"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP CONSTRAINT "FK_b974c2da030070591f75f3e4d59"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "visiting_congregation_id"`);
    }
}
exports.AddVisitingCongregationIndWeekendSchedule1760797048383 = AddVisitingCongregationIndWeekendSchedule1760797048383;
