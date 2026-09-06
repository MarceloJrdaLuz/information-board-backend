import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePublicWitnessTimeSlotPreferences1787300000000 implements MigrationInterface {
    name = 'CreatePublicWitnessTimeSlotPreferences1787300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public_witness_time_slot_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "time_slot_id" uuid NOT NULL, "publisher_id" uuid NOT NULL, CONSTRAINT "UQ_pw_time_slot_publisher_preference" UNIQUE ("time_slot_id", "publisher_id"), CONSTRAINT "PK_pw_time_slot_preferences" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_preferences" ADD CONSTRAINT "FK_pw_tsp_time_slot" FOREIGN KEY ("time_slot_id") REFERENCES "public_witness_time_slots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_preferences" ADD CONSTRAINT "FK_pw_tsp_publisher" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_preferences" DROP CONSTRAINT "FK_pw_tsp_publisher"`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_preferences" DROP CONSTRAINT "FK_pw_tsp_time_slot"`);
        await queryRunner.query(`DROP TABLE "public_witness_time_slot_preferences"`);
    }
}

