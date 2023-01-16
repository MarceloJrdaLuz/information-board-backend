import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673878908130 implements MigrationInterface {
    name = 'default1673878908130'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" ADD "city" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "city"`);
    }

}
