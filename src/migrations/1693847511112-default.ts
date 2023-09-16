import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693847511112 implements MigrationInterface {
    name = 'default1693847511112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP COLUMN "phone"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD "phone" text NOT NULL`);
    }

}
