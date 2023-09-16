import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693328409874 implements MigrationInterface {
    name = 'default1693328409874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "fullName" TO "publisher"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "publisher" TO "fullName"`);
    }

}
