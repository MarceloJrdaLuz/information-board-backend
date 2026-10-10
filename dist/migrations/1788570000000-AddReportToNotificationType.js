"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddReportToNotificationType1788570000000 = void 0;
class AddReportToNotificationType1788570000000 {
    constructor() {
        this.name = 'AddReportToNotificationType1788570000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'REPORT'`);
    }
    async down(queryRunner) {
    }
}
exports.AddReportToNotificationType1788570000000 = AddReportToNotificationType1788570000000;
