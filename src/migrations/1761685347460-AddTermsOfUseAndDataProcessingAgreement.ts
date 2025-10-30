import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTermsOfUseAndDataProcessingAgreement1761685347460 implements MigrationInterface {
    name = 'AddTermsOfUseAndDataProcessingAgreement1761685347460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "terms_of_use" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(50) NOT NULL, "version" character varying(10) NOT NULL, "title" character varying(255) NOT NULL, "content" text NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_876c6c2717bea0d112b5a863cc1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "data_processing_agreements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(50) NOT NULL, "version" character varying(10) NOT NULL, "content_snapshot" text NOT NULL, "content_hash" character varying(128), "accepted_at" TIMESTAMP NOT NULL, "accepted_by_user_id" uuid, "deviceId" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "publisher_id" uuid, "congregation_id" uuid, "terms_id" uuid, CONSTRAINT "PK_750a52e701f6943f8520fff01f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "has_active_consent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_6fde597dab4669ad06c7f3cad74" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_5629614857cd9cf94e2f1a249f9" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_632860e7d462af435b2634c49cd" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_5220784f2399f2fb71baebd313e" FOREIGN KEY ("terms_id") REFERENCES "terms_of_use"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_5220784f2399f2fb71baebd313e"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_632860e7d462af435b2634c49cd"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_5629614857cd9cf94e2f1a249f9"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_6fde597dab4669ad06c7f3cad74"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "has_active_consent"`);
        await queryRunner.query(`DROP TABLE "data_processing_agreements"`);
        await queryRunner.query(`DROP TABLE "terms_of_use"`);
    }

}
