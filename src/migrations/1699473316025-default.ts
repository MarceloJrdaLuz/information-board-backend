import { MigrationInterface, QueryRunner } from "typeorm";

export class default1699473316025 implements MigrationInterface {
    name = 'default1699473316025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" RENAME COLUMN "privilege" TO "privileges"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" RENAME COLUMN "privileges" TO "privilege"`);
    }

}
