"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRecurrenceType1768358485316 = void 0;
class AddRecurrenceType1768358485316 {
    constructor() {
        this.name = 'AddRecurrenceType1768358485316';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."publisher_reminders_recurrencetype_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')`);
        await queryRunner.query(`ALTER TABLE "publisher_reminders" ADD "recurrenceType" "public"."publisher_reminders_recurrencetype_enum" NOT NULL DEFAULT 'DAILY'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_reminders" DROP COLUMN "recurrenceType"`);
        await queryRunner.query(`DROP TYPE "public"."publisher_reminders_recurrencetype_enum"`);
    }
}
exports.AddRecurrenceType1768358485316 = AddRecurrenceType1768358485316;
