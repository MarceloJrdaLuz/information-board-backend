import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCleaningGroupPreferenceAndUnavailabilities1788574000000 implements MigrationInterface {
    name = "AddCleaningGroupPreferenceAndUnavailabilities1788574000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cleaning_group" 
            ADD COLUMN IF NOT EXISTS "dayPreference" character varying(20) NOT NULL DEFAULT 'ALL';
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cleaning_group_unavailabilities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "congregation_id" uuid NOT NULL,
                "group_id" uuid NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "reason" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cleaning_group_unavailabilities" PRIMARY KEY ("id"),
                CONSTRAINT "FK_cgu_congregation" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_cgu_group" FOREIGN KEY ("group_id") REFERENCES "cleaning_group"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_cgu_congregation_id" ON "cleaning_group_unavailabilities" ("congregation_id");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_cgu_group_id" ON "cleaning_group_unavailabilities" ("group_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "cleaning_group_unavailabilities";`);
        await queryRunner.query(`ALTER TABLE "cleaning_group" DROP COLUMN IF EXISTS "dayPreference";`);
    }
}

