import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677499988115 implements MigrationInterface {
    name = 'default1677499988115'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "avatar_url" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "avatar_url"`);
    }

}
