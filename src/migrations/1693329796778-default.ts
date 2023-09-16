import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693329796778 implements MigrationInterface {
    name = 'default1693329796778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher" jsonb NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher"`);
    }

}
