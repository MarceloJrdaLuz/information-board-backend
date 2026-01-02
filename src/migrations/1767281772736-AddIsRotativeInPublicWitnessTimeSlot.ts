import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsRotativeInPublicWitnessTimeSlot1767281772736 implements MigrationInterface {
    name = 'AddIsRotativeInPublicWitnessTimeSlot1767281772736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public_witness_time_slots" ADD "is_rotative" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public_witness_time_slots" DROP COLUMN "is_rotative"`);
    }

}
