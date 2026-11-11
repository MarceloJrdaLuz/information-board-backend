"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateScheduleReminderConfigs1789520000000 = void 0;
class CreateScheduleReminderConfigs1789520000000 {
    constructor() {
        this.name = "CreateScheduleReminderConfigs1789520000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "schedule_reminder_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "congregation_id" uuid NOT NULL,
                "cleaning_days_before" integer NOT NULL DEFAULT 15,
                "cleaning_enabled" boolean NOT NULL DEFAULT true,
                "field_service_days_before" integer NOT NULL DEFAULT 15,
                "field_service_enabled" boolean NOT NULL DEFAULT true,
                "public_witnessing_days_before" integer NOT NULL DEFAULT 15,
                "public_witnessing_enabled" boolean NOT NULL DEFAULT true,
                "midweek_meeting_days_before" integer NOT NULL DEFAULT 30,
                "midweek_meeting_enabled" boolean NOT NULL DEFAULT true,
                "weekend_meeting_days_before" integer NOT NULL DEFAULT 20,
                "weekend_meeting_enabled" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_schedule_reminder_configs" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_schedule_reminder_configs_congregation" UNIQUE ("congregation_id"),
                CONSTRAINT "FK_src_congregation" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_src_congregation_id" ON "schedule_reminder_configs" ("congregation_id");
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "schedule_reminder_configs";`);
    }
}
exports.CreateScheduleReminderConfigs1789520000000 = CreateScheduleReminderConfigs1789520000000;
