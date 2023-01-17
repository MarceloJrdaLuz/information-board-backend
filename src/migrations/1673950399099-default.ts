import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673950399099 implements MigrationInterface {
    name = 'default1673950399099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "fk_congregation_id" integer`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_f87f73d21f46ad021508583a25e" FOREIGN KEY ("fk_congregation_id") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_f87f73d21f46ad021508583a25e"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "fk_congregation_id"`);
    }

}
