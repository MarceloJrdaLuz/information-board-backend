import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673909115867 implements MigrationInterface {
    name = 'default1673909115867'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_1d27d5daf126e4dfa7c7a31bfe6"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "documentsId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD "documentsId" uuid`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_1d27d5daf126e4dfa7c7a31bfe6" FOREIGN KEY ("documentsId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
