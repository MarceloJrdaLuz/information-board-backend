import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPublisherIdInConsentRecord1759319709014 implements MigrationInterface {
    name = 'AddPublisherIdInConsentRecord1759319709014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher_id"`);
    }

}
