import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReportToNotificationType1788570000000 implements MigrationInterface {
    name = 'AddReportToNotificationType1788570000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'REPORT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

