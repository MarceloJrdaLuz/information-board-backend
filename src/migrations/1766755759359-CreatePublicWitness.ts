import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePublicWitness1766755759359 implements MigrationInterface {
    name = 'CreatePublicWitness1766755759359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "public_witness_arrangements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "congregation_id" uuid NOT NULL, "is_fixed" boolean NOT NULL DEFAULT false, "weekday" integer, "date" date, "title" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_777c069f94fe6f9ec6d40701666" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "public_witness_time_slot_default_publishers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "time_slot_id" uuid NOT NULL, "publisher_id" uuid NOT NULL, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_afe72f55acda239b15e8ae00d00" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "public_witness_time_slots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "arrangement_id" uuid NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_450866438f23da6ee04115a2e2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "public_witness_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "time_slot_id" uuid NOT NULL, "date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_78124e19b5431d1142fefe7fc31" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "public_witness_assignment_publishers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignment_id" uuid NOT NULL, "publisher_id" uuid NOT NULL, "order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_ac1d8a1609924ce7c4c66ca85c6" UNIQUE ("assignment_id", "publisher_id"), CONSTRAINT "PK_0853fee7ef714dcb3bda4f86073" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "public_witness_arrangements" ADD CONSTRAINT "FK_168a61f4e9bc715ff92064f4375" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_default_publishers" ADD CONSTRAINT "FK_fb3589f48d36816102dd1f53e79" FOREIGN KEY ("time_slot_id") REFERENCES "public_witness_time_slots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_default_publishers" ADD CONSTRAINT "FK_dc0c8fe874b84b30d21ff3648d2" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slots" ADD CONSTRAINT "FK_eeba1dbf2887c54b2caf71504e9" FOREIGN KEY ("arrangement_id") REFERENCES "public_witness_arrangements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" ADD CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3" FOREIGN KEY ("time_slot_id") REFERENCES "public_witness_time_slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignment_publishers" ADD CONSTRAINT "FK_3ff387aa7f73e79d2dc59f2b804" FOREIGN KEY ("assignment_id") REFERENCES "public_witness_assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignment_publishers" ADD CONSTRAINT "FK_e46d56c0b580aa26b4b171a8e9e" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public_witness_assignment_publishers" DROP CONSTRAINT "FK_e46d56c0b580aa26b4b171a8e9e"`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignment_publishers" DROP CONSTRAINT "FK_3ff387aa7f73e79d2dc59f2b804"`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" DROP CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3"`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slots" DROP CONSTRAINT "FK_eeba1dbf2887c54b2caf71504e9"`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_default_publishers" DROP CONSTRAINT "FK_dc0c8fe874b84b30d21ff3648d2"`);
        await queryRunner.query(`ALTER TABLE "public_witness_time_slot_default_publishers" DROP CONSTRAINT "FK_fb3589f48d36816102dd1f53e79"`);
        await queryRunner.query(`ALTER TABLE "public_witness_arrangements" DROP CONSTRAINT "FK_168a61f4e9bc715ff92064f4375"`);
        await queryRunner.query(`DROP TABLE "public_witness_assignment_publishers"`);
        await queryRunner.query(`DROP TABLE "public_witness_assignments"`);
        await queryRunner.query(`DROP TABLE "public_witness_time_slots"`);
        await queryRunner.query(`DROP TABLE "public_witness_time_slot_default_publishers"`);
        await queryRunner.query(`DROP TABLE "public_witness_arrangements"`);
    }

}
