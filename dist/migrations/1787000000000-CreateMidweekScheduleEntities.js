"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMidweekScheduleEntities1787000000000 = void 0;
class CreateMidweekScheduleEntities1787000000000 {
    constructor() {
        this.name = "CreateMidweekScheduleEntities1787000000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TYPE "public"."midweek_section_enum" AS ENUM('TREASURES', 'MINISTRY', 'LIVING');
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."midweek_part_type_enum" AS ENUM(
                'TALK', 'GEMS', 'BIBLE_READING', 'INITIAL_CALL', 'RETURN_VISIT',
                'BIBLE_STUDY', 'EXPLAIN_BELIEFS', 'STUDENT_TALK', 'WHAT_WOULD_YOU_SAY',
                'LIVING_ITEM', 'LOCAL_NEEDS', 'CBS', 'CUSTOM'
            );
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."midweek_special_type_enum" AS ENUM(
                'NONE', 'CIRCUIT_OVERSEER_VISIT', 'CIRCUIT_ASSEMBLY', 'REGIONAL_CONVENTION',
                'MEMORIAL', 'SPECIAL_TALK', 'CUSTOM'
            );
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."midweek_room_enum" AS ENUM('MAIN', 'AUXILIARY_1', 'AUXILIARY_2');
        `);
        await queryRunner.query(`
            CREATE TABLE "midweek_workbook_weeks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "weekDate" date NOT NULL,
                "weeklyBibleReading" text,
                "watchtowerStudyTheme" text,
                "songOpen" integer,
                "songMiddle" integer,
                "songEnd" integer,
                "cbsSource" text,
                "presentations" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_midweek_workbook_weeks_weekDate" UNIQUE ("weekDate"),
                CONSTRAINT "PK_midweek_workbook_weeks" PRIMARY KEY ("id")
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "midweek_workbook_parts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workbook_week_id" uuid NOT NULL,
                "section" "public"."midweek_section_enum" NOT NULL DEFAULT 'MINISTRY',
                "partType" "public"."midweek_part_type_enum" NOT NULL DEFAULT 'INITIAL_CALL',
                "title" text NOT NULL,
                "sourceMaterial" text,
                "timeMinutes" integer NOT NULL DEFAULT 3,
                "lessonNumber" integer,
                "studyPoint" integer,
                "studyPointDescription" text,
                "brochure" text,
                "requiresAssistant" boolean NOT NULL DEFAULT false,
                "method" text,
                "prompts" text,
                "orderIndex" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_midweek_workbook_parts" PRIMARY KEY ("id"),
                CONSTRAINT "FK_midweek_workbook_parts_week" FOREIGN KEY ("workbook_week_id") REFERENCES "midweek_workbook_weeks"("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "midweek_schedules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "congregation_id" uuid NOT NULL,
                "workbook_week_id" uuid,
                "weekDate" date NOT NULL,
                "meetingDate" date NOT NULL,
                "weeklyBibleReading" text,
                "watchtowerStudyTheme" text,
                "songOpen" integer,
                "songMiddle" integer,
                "songEnd" integer,
                "chairman_id" uuid,
                "opening_prayer_id" uuid,
                "closing_prayer_id" uuid,
                "aux_counselor_1_id" uuid,
                "aux_counselor_2_id" uuid,
                "cbs_conductor_id" uuid,
                "cbs_reader_id" uuid,
                "isSpecial" boolean NOT NULL DEFAULT false,
                "specialType" "public"."midweek_special_type_enum" NOT NULL DEFAULT 'NONE',
                "specialName" text,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_midweek_schedules" PRIMARY KEY ("id"),
                CONSTRAINT "FK_midweek_schedules_congregation" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_midweek_schedules_workbook_week" FOREIGN KEY ("workbook_week_id") REFERENCES "midweek_workbook_weeks"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_schedules_chairman" FOREIGN KEY ("chairman_id") REFERENCES "publishers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_schedules_opening_prayer" FOREIGN KEY ("opening_prayer_id") REFERENCES "publishers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_schedules_closing_prayer" FOREIGN KEY ("closing_prayer_id") REFERENCES "publishers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_schedules_aux_counselor_1" FOREIGN KEY ("aux_counselor_1_id") REFERENCES "publishers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_schedules_aux_counselor_2" FOREIGN KEY ("aux_counselor_2_id") REFERENCES "publishers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_schedules_cbs_conductor" FOREIGN KEY ("cbs_conductor_id") REFERENCES "publishers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_schedules_cbs_reader" FOREIGN KEY ("cbs_reader_id") REFERENCES "publishers"("id") ON DELETE SET NULL
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "midweek_meeting_parts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "schedule_id" uuid NOT NULL,
                "workbook_part_id" uuid,
                "section" "public"."midweek_section_enum" NOT NULL DEFAULT 'MINISTRY',
                "partType" "public"."midweek_part_type_enum" NOT NULL DEFAULT 'INITIAL_CALL',
                "title" text NOT NULL,
                "sourceMaterial" text,
                "timeMinutes" integer NOT NULL DEFAULT 3,
                "lessonNumber" integer,
                "studyPoint" integer,
                "studyPointDescription" text,
                "brochure" text,
                "requiresAssistant" boolean NOT NULL DEFAULT false,
                "method" text,
                "room" "public"."midweek_room_enum" NOT NULL DEFAULT 'MAIN',
                "assigned_publisher_id" uuid,
                "assistant_publisher_id" uuid,
                "orderIndex" integer NOT NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "isCompleted" boolean NOT NULL DEFAULT false,
                "prompts" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_midweek_meeting_parts" PRIMARY KEY ("id"),
                CONSTRAINT "FK_midweek_meeting_parts_schedule" FOREIGN KEY ("schedule_id") REFERENCES "midweek_schedules"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_midweek_meeting_parts_workbook_part" FOREIGN KEY ("workbook_part_id") REFERENCES "midweek_workbook_parts"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_meeting_parts_assigned_pub" FOREIGN KEY ("assigned_publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_midweek_meeting_parts_assistant_pub" FOREIGN KEY ("assistant_publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "publisher_midweek_qualifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "publisher_id" uuid NOT NULL,
                "canBeChairman" boolean NOT NULL DEFAULT false,
                "canPray" boolean NOT NULL DEFAULT false,
                "canTreasuresTalk" boolean NOT NULL DEFAULT false,
                "canSpiritualGems" boolean NOT NULL DEFAULT false,
                "canBibleReading" boolean NOT NULL DEFAULT false,
                "canStudentInitialCall" boolean NOT NULL DEFAULT true,
                "canStudentReturnVisit" boolean NOT NULL DEFAULT true,
                "canStudentBibleStudy" boolean NOT NULL DEFAULT true,
                "canStudentExplainBeliefs" boolean NOT NULL DEFAULT true,
                "canStudentTalk" boolean NOT NULL DEFAULT false,
                "canBeAssistant" boolean NOT NULL DEFAULT true,
                "canLivingParts" boolean NOT NULL DEFAULT false,
                "canLocalNeeds" boolean NOT NULL DEFAULT false,
                "canCbsConductor" boolean NOT NULL DEFAULT false,
                "canCbsReader" boolean NOT NULL DEFAULT false,
                "canAuxCounselor" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_publisher_midweek_qualifications_publisher_id" UNIQUE ("publisher_id"),
                CONSTRAINT "PK_publisher_midweek_qualifications" PRIMARY KEY ("id"),
                CONSTRAINT "FK_publisher_midweek_qualifications_publisher" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`
            CREATE TABLE "publisher_unavailabilities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "publisher_id" uuid NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "reason" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_publisher_unavailabilities" PRIMARY KEY ("id"),
                CONSTRAINT "FK_publisher_unavailabilities_publisher" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE
            );
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "publisher_unavailabilities";`);
        await queryRunner.query(`DROP TABLE "publisher_midweek_qualifications";`);
        await queryRunner.query(`DROP TABLE "midweek_meeting_parts";`);
        await queryRunner.query(`DROP TABLE "midweek_schedules";`);
        await queryRunner.query(`DROP TABLE "midweek_workbook_parts";`);
        await queryRunner.query(`DROP TABLE "midweek_workbook_weeks";`);
        await queryRunner.query(`DROP TYPE "public"."midweek_room_enum";`);
        await queryRunner.query(`DROP TYPE "public"."midweek_special_type_enum";`);
        await queryRunner.query(`DROP TYPE "public"."midweek_part_type_enum";`);
        await queryRunner.query(`DROP TYPE "public"."midweek_section_enum";`);
    }
}
exports.CreateMidweekScheduleEntities1787000000000 = CreateMidweekScheduleEntities1787000000000;
