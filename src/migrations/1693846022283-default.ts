import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693846022283 implements MigrationInterface {
    name = 'default1693846022283'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ADD "phone" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "phone"`);
    }

}
