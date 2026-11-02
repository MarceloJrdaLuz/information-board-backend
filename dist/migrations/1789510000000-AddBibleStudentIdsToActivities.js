"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBibleStudentIdsToActivities1789510000000 = void 0;
class AddBibleStudentIdsToActivities1789510000000 {
    constructor() {
        this.name = "AddBibleStudentIdsToActivities1789510000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "publisher_field_activities"
            ADD COLUMN IF NOT EXISTS "bible_student_ids" text
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "publisher_field_activities"
            DROP COLUMN IF EXISTS "bible_student_ids"
        `);
    }
}
exports.AddBibleStudentIdsToActivities1789510000000 = AddBibleStudentIdsToActivities1789510000000;
