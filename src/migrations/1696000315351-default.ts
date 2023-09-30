import { MigrationInterface, QueryRunner } from "typeorm";

export class default1696000315351 implements MigrationInterface {
    name = 'default1696000315351'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
