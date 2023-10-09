import { MigrationInterface, QueryRunner } from "typeorm";

export class default1696865911324 implements MigrationInterface {
    name = 'default1696865911324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ADD "birthDate" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "birthDate"`);
    }

}
