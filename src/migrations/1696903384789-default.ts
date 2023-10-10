import { MigrationInterface, QueryRunner } from "typeorm";

export class default1696903384789 implements MigrationInterface {
    name = 'default1696903384789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" text`);
    }

}
