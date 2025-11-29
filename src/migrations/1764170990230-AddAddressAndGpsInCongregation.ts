import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressAndGpsInCongregation1764170990230 implements MigrationInterface {
    name = 'AddAddressAndGpsInCongregation1764170990230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" ADD "latitude" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "longitude" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "address" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "latitude"`);
    }

}
