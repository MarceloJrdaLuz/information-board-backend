import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublisherReminders1768227565547 implements MigrationInterface {
    name = 'AddPublisherReminders1768227565547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "publisher_reminders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "description" text, "startDate" date NOT NULL, "endDate" date, "isRecurring" boolean NOT NULL DEFAULT false, "recurrenceIntervalDays" integer, "recurrenceCount" integer, "recurrenceExecutedCount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "publisher_id" uuid, CONSTRAINT "PK_34050156b82eb5d08857cc43621" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "publisher_reminders" ADD CONSTRAINT "FK_1a1b1d7b0ef749d47658f223b06" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publisher_reminders" DROP CONSTRAINT "FK_1a1b1d7b0ef749d47658f223b06"`);
        await queryRunner.query(`DROP TABLE "publisher_reminders"`);
    }

}
