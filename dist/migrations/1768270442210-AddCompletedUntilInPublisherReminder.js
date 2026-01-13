"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCompletedUntilInPublisherReminder1768270442210 = void 0;
class AddCompletedUntilInPublisherReminder1768270442210 {
    constructor() {
        this.name = 'AddCompletedUntilInPublisherReminder1768270442210';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_reminders" ADD "completed_until" date`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_reminders" DROP COLUMN "completed_until"`);
    }
}
exports.AddCompletedUntilInPublisherReminder1768270442210 = AddCompletedUntilInPublisherReminder1768270442210;
