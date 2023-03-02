import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677518116676 implements MigrationInterface {
    name = 'default1677518116676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "avatar_bucket_key" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "avatar_bucket_key"`);
    }

}
