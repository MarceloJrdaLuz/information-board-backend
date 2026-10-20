"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCustomAssigneeNamesInMidweek1788575000000 = void 0;
class AddCustomAssigneeNamesInMidweek1788575000000 {
    constructor() {
        this.name = "AddCustomAssigneeNamesInMidweek1788575000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "midweek_meeting_parts" 
            ADD COLUMN IF NOT EXISTS "custom_assistant_name" character varying;
        `);
        await queryRunner.query(`
            ALTER TABLE "midweek_schedules" 
            ADD COLUMN IF NOT EXISTS "custom_chairman_name" character varying,
            ADD COLUMN IF NOT EXISTS "custom_opening_prayer_name" character varying,
            ADD COLUMN IF NOT EXISTS "custom_closing_prayer_name" character varying,
            ADD COLUMN IF NOT EXISTS "custom_aux_counselor_1_name" character varying,
            ADD COLUMN IF NOT EXISTS "custom_aux_counselor_2_name" character varying,
            ADD COLUMN IF NOT EXISTS "custom_cbs_conductor_name" character varying,
            ADD COLUMN IF NOT EXISTS "custom_cbs_reader_name" character varying;
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "midweek_meeting_parts" 
            DROP COLUMN IF EXISTS "custom_assistant_name";
        `);
        await queryRunner.query(`
            ALTER TABLE "midweek_schedules" 
            DROP COLUMN IF EXISTS "custom_chairman_name",
            DROP COLUMN IF EXISTS "custom_opening_prayer_name",
            DROP COLUMN IF EXISTS "custom_closing_prayer_name",
            DROP COLUMN IF EXISTS "custom_aux_counselor_1_name",
            DROP COLUMN IF EXISTS "custom_aux_counselor_2_name",
            DROP COLUMN IF EXISTS "custom_cbs_conductor_name",
            DROP COLUMN IF EXISTS "custom_cbs_reader_name";
        `);
    }
}
exports.AddCustomAssigneeNamesInMidweek1788575000000 = AddCustomAssigneeNamesInMidweek1788575000000;
