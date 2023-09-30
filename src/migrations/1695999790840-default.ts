import { MigrationInterface, QueryRunner } from "typeorm";

export class default1695999790840 implements MigrationInterface {
    name = 'default1695999790840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
