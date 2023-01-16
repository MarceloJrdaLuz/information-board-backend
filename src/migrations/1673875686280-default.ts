import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673875686280 implements MigrationInterface {
    name = 'default1673875686280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "congregationId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_d883ed317f0dc1c1ce32fa1745d" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_d883ed317f0dc1c1ce32fa1745d"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "congregationId"`);
    }

}
