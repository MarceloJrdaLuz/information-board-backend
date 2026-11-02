import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBibleStudentIdsToActivities1789510000000 implements MigrationInterface {
    name = "AddBibleStudentIdsToActivities1789510000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "publisher_field_activities"
            ADD COLUMN IF NOT EXISTS "bible_student_ids" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "publisher_field_activities"
            DROP COLUMN IF EXISTS "bible_student_ids"
        `);
    }
}

