import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673912366969 implements MigrationInterface {
    name = 'default1673912366969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "congregation_id" integer`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_270ec4d83ed0462d27d9e881434" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_270ec4d83ed0462d27d9e881434"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "congregation_id"`);
    }

}
