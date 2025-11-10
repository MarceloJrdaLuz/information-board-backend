import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDataProcessingRelations1762806793786 implements MigrationInterface {
    name = 'UpdateDataProcessingRelations1762806793786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_5220784f2399f2fb71baebd313e"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_632860e7d462af435b2634c49cd"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_5629614857cd9cf94e2f1a249f9"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_6fde597dab4669ad06c7f3cad74"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_6fde597dab4669ad06c7f3cad74" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_5629614857cd9cf94e2f1a249f9" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_632860e7d462af435b2634c49cd" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_5220784f2399f2fb71baebd313e" FOREIGN KEY ("terms_id") REFERENCES "terms_of_use"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_5220784f2399f2fb71baebd313e"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_632860e7d462af435b2634c49cd"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_5629614857cd9cf94e2f1a249f9"`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" DROP CONSTRAINT "FK_6fde597dab4669ad06c7f3cad74"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_6fde597dab4669ad06c7f3cad74" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_5629614857cd9cf94e2f1a249f9" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_632860e7d462af435b2634c49cd" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_processing_agreements" ADD CONSTRAINT "FK_5220784f2399f2fb71baebd313e" FOREIGN KEY ("terms_id") REFERENCES "terms_of_use"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
