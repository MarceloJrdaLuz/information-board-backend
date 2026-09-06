"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMechanicalScheduleEntities1787400000000 = void 0;
class CreateMechanicalScheduleEntities1787400000000 {
    constructor() {
        this.name = "CreateMechanicalScheduleEntities1787400000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."mechanical_meeting_type_enum" AS ENUM('MIDWEEK', 'WEEKEND');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."mechanical_role_enum" AS ENUM(
                    'ATTENDANT', 'SOUND', 'MEDIA', 'SOUND_AND_MEDIA', 'ROVING_MIC', 'STAGE_MIC'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mechanical_schedule_config" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "congregation_id" uuid NOT NULL,
                "combineSoundAndMedia" boolean NOT NULL DEFAULT false,
                "midweekAttendantsCount" integer NOT NULL DEFAULT 2,
                "midweekSoundCount" integer NOT NULL DEFAULT 1,
                "midweekMediaCount" integer NOT NULL DEFAULT 1,
                "midweekRovingMicsCount" integer NOT NULL DEFAULT 2,
                "midweekStageMicsCount" integer NOT NULL DEFAULT 1,
                "weekendAttendantsCount" integer NOT NULL DEFAULT 2,
                "weekendSoundCount" integer NOT NULL DEFAULT 1,
                "weekendMediaCount" integer NOT NULL DEFAULT 1,
                "weekendRovingMicsCount" integer NOT NULL DEFAULT 2,
                "weekendStageMicsCount" integer NOT NULL DEFAULT 1,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_mechanical_schedule_config_congregation" UNIQUE ("congregation_id"),
                CONSTRAINT "PK_mechanical_schedule_config" PRIMARY KEY ("id"),
                CONSTRAINT "FK_mechanical_schedule_config_congregation" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mechanical_schedules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "congregation_id" uuid NOT NULL,
                "weekStartDate" date NOT NULL,
                "date" date NOT NULL,
                "meetingType" "public"."mechanical_meeting_type_enum" NOT NULL,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_mechanical_schedules" PRIMARY KEY ("id"),
                CONSTRAINT "FK_mechanical_schedules_congregation" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mechanical_assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "schedule_id" uuid NOT NULL,
                "role" "public"."mechanical_role_enum" NOT NULL,
                "order" integer NOT NULL DEFAULT 1,
                "publisher_id" uuid,
                "isManual" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_mechanical_assignments" PRIMARY KEY ("id"),
                CONSTRAINT "FK_mechanical_assignments_schedule" FOREIGN KEY ("schedule_id") REFERENCES "mechanical_schedules"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_mechanical_assignments_publisher" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL
            );
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_mechanical_schedules_congregation_week" 
            ON "mechanical_schedules" ("congregation_id", "weekStartDate");
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_mechanical_assignments_schedule" 
            ON "mechanical_assignments" ("schedule_id");
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_mechanical_assignments_publisher" 
            ON "mechanical_assignments" ("publisher_id");
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "mechanical_assignments";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mechanical_schedules";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mechanical_schedule_config";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."mechanical_role_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."mechanical_meeting_type_enum";`);
    }
}
exports.CreateMechanicalScheduleEntities1787400000000 = CreateMechanicalScheduleEntities1787400000000;
