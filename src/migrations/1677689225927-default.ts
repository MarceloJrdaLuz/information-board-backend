import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677689225927 implements MigrationInterface {
    name = 'default1677689225927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ALTER COLUMN "privileges" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ALTER COLUMN "privileges" SET NOT NULL`);
    }

}
