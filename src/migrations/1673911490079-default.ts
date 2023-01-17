import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673911490079 implements MigrationInterface {
    name = 'default1673911490079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "documents_congregationId" integer`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_5b7212604d3a41d98fb3ac98677" FOREIGN KEY ("documents_congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_5b7212604d3a41d98fb3ac98677"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "documents_congregationId"`);
    }

}
