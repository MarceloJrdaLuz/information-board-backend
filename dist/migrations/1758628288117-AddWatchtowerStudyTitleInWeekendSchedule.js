"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWatchtowerStudyTitleInWeekendSchedule1758628288117 = void 0;
class AddWatchtowerStudyTitleInWeekendSchedule1758628288117 {
    constructor() {
        this.name = 'AddWatchtowerStudyTitleInWeekendSchedule1758628288117';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD "watchTowerStudyTitle" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP COLUMN "watchTowerStudyTitle"`);
    }
}
exports.AddWatchtowerStudyTitleInWeekendSchedule1758628288117 = AddWatchtowerStudyTitleInWeekendSchedule1758628288117;
