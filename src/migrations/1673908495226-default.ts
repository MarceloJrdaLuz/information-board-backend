import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673908495226 implements MigrationInterface {
    name = 'default1673908495226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "UQ_7b7115fda47b20b277b8ca6f89f" UNIQUE ("description")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_7b7115fda47b20b277b8ca6f89f"`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`);
    }

}
