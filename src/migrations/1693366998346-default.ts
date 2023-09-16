import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693366998346 implements MigrationInterface {
    name = 'default1693366998346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher"`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "fullName" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "nickname" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "congregation_id" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "congregation_id"`);
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "nickname"`);
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher" jsonb NOT NULL`);
    }

}
