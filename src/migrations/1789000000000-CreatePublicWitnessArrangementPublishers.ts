import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePublicWitnessArrangementPublishers1789000000000 implements MigrationInterface {
    name = 'CreatePublicWitnessArrangementPublishers1789000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public_witness_arrangement_publishers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "arrangement_id" uuid NOT NULL, "publisher_id" uuid NOT NULL, CONSTRAINT "UQ_pw_arrangement_publisher" UNIQUE ("arrangement_id", "publisher_id"), CONSTRAINT "PK_pw_arrangement_publishers" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "public_witness_arrangement_publishers" ADD CONSTRAINT "FK_pw_ap_arrangement" FOREIGN KEY ("arrangement_id") REFERENCES "public_witness_arrangements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_arrangement_publishers" ADD CONSTRAINT "FK_pw_ap_publisher" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public_witness_arrangement_publishers" DROP CONSTRAINT "FK_pw_ap_publisher"`);
        await queryRunner.query(`ALTER TABLE "public_witness_arrangement_publishers" DROP CONSTRAINT "FK_pw_ap_arrangement"`);
        await queryRunner.query(`DROP TABLE "public_witness_arrangement_publishers"`);
    }
}

