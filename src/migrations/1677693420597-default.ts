import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677693420597 implements MigrationInterface {
    name = 'default1677693420597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_177bb9a955d0213e788592e7359"`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_177bb9a955d0213e788592e7359" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_177bb9a955d0213e788592e7359"`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_177bb9a955d0213e788592e7359" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
