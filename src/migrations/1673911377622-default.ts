import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673911377622 implements MigrationInterface {
    name = 'default1673911377622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5"`);
        await queryRunner.query(`ALTER TABLE "documents" RENAME COLUMN "categoryId" TO "documents_congregationId"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "documents_congregationId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "documents_congregationId" integer`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_5b7212604d3a41d98fb3ac98677" FOREIGN KEY ("documents_congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_5b7212604d3a41d98fb3ac98677"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "documents_congregationId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "documents_congregationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" RENAME COLUMN "documents_congregationId" TO "categoryId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
