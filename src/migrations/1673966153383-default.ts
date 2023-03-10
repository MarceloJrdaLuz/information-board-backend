import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673966153383 implements MigrationInterface {
    name = 'default1673966153383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "congregationId" integer`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "congregationId"`);
    }

}
