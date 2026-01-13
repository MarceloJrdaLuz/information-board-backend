import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompletedUntilInPublisherReminder1768270442210 implements MigrationInterface {
    name = 'AddCompletedUntilInPublisherReminder1768270442210'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publisher_reminders" ADD "completed_until" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publisher_reminders" DROP COLUMN "completed_until"`);
    }

}
