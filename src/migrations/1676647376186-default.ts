import { MigrationInterface, QueryRunner } from "typeorm";

export class default1676647376186 implements MigrationInterface {
    name = 'default1676647376186'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" ADD "text" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "circuit" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "imageUrl" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "circuit"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "text"`);
    }

}
