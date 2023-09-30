import { MigrationInterface, QueryRunner } from "typeorm";

export class default1696008711580 implements MigrationInterface {
    name = 'default1696008711580'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
