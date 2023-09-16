import { MigrationInterface, QueryRunner } from "typeorm";

export class default1694825715770 implements MigrationInterface {
    name = 'default1694825715770'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "image_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "imageKey" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "imageKey" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "image_url" SET NOT NULL`);
    }

}
