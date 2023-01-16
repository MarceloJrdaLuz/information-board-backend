import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673877997192 implements MigrationInterface {
    name = 'default1673877997192'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "UQ_750ee3156ef897dcab29f993dfb" UNIQUE ("number")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "UQ_750ee3156ef897dcab29f993dfb"`);
    }

}
