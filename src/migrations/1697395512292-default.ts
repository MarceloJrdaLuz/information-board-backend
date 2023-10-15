import { MigrationInterface, QueryRunner } from "typeorm";

export class default1697395512292 implements MigrationInterface {
    name = 'default1697395512292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "lastName"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" ADD "lastName" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "name" text NOT NULL`);
    }

}
