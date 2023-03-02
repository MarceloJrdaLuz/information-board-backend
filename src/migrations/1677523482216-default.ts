import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677523482216 implements MigrationInterface {
    name = 'default1677523482216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetToken" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetExpires" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetExpires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetToken"`);
    }

}
