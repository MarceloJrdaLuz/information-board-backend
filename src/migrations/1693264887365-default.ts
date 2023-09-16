import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693264887365 implements MigrationInterface {
    name = 'default1693264887365'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "ip" TO "deviceId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "deviceId" TO "ip"`);
    }

}
