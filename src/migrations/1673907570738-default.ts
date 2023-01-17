import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673907570738 implements MigrationInterface {
    name = 'default1673907570738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "categoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "categoryId"`);
    }

}
