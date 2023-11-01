import { MigrationInterface, QueryRunner } from "typeorm";

export class default1698805001491 implements MigrationInterface {
    name = 'default1698805001491'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "publications"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "videos"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "revisits"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" ADD "revisits" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "videos" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "publications" integer`);
    }

}
