import { MigrationInterface, QueryRunner } from "typeorm";

export class default1733763488803 implements MigrationInterface {
    name = 'default1733763488803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "UQ_16535bb7161972fb121eef4522a" UNIQUE ("publisher_id", "month", "year")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "UQ_16535bb7161972fb121eef4522a"`);
    }

}
