import { MigrationInterface, QueryRunner } from "typeorm";

export class default1696008942610 implements MigrationInterface {
    name = 'default1696008942610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000"`);
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
