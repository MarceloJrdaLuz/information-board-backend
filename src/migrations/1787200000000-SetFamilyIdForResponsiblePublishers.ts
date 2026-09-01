import { MigrationInterface, QueryRunner } from "typeorm";

export class SetFamilyIdForResponsiblePublishers1787200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "publishers"
            SET "family_id" = "families"."id"
            FROM "families"
            WHERE "publishers"."id" = "families"."responsible_publisher_id"
              AND "publishers"."family_id" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op or optional rollback
    }
}

