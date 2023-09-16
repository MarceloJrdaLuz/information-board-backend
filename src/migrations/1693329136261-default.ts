import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693329136261 implements MigrationInterface {
    name = 'default1693329136261'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher" text NOT NULL`);
    }

}
