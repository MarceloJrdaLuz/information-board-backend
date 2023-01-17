import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673907386218 implements MigrationInterface {
    name = 'default1673907386218'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "REL_2d7e06f29424dbb29a827a7c1b"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "REL_d1cad809d29faad0ff16f81bbc"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "category" ADD "documentsId" uuid`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_1d27d5daf126e4dfa7c7a31bfe6" FOREIGN KEY ("documentsId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_1d27d5daf126e4dfa7c7a31bfe6"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "documentsId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "congregationId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "REL_d1cad809d29faad0ff16f81bbc" UNIQUE ("congregationId")`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "categoryId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "REL_2d7e06f29424dbb29a827a7c1b" UNIQUE ("categoryId")`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
