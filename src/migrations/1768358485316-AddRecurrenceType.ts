import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurrenceType1768358485316 implements MigrationInterface {
    name = 'AddRecurrenceType1768358485316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."publisher_reminders_recurrencetype_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')`);
        await queryRunner.query(`ALTER TABLE "publisher_reminders" ADD "recurrenceType" "public"."publisher_reminders_recurrencetype_enum" NOT NULL DEFAULT 'DAILY'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publisher_reminders" DROP COLUMN "recurrenceType"`);
        await queryRunner.query(`DROP TYPE "public"."publisher_reminders_recurrencetype_enum"`);
    }

}
