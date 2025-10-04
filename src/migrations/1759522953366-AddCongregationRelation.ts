import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCongregationRelation1759522953366 implements MigrationInterface {
    name = 'AddCongregationRelation1759522953366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" ADD "congregation_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" ADD CONSTRAINT "FK_f85352cb972d2227c7bc051065b" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" DROP CONSTRAINT "FK_f85352cb972d2227c7bc051065b"`);
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" DROP COLUMN "congregation_id"`);
    }

}
