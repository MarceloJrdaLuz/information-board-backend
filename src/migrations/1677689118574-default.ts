import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677689118574 implements MigrationInterface {
    name = 'default1677689118574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ALTER COLUMN "nickname" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ALTER COLUMN "nickname" SET NOT NULL`);
    }

}
