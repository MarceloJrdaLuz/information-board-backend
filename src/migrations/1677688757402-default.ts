import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677688757402 implements MigrationInterface {
    name = 'default1677688757402'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "publishers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" text NOT NULL, "nickname" text NOT NULL, "privileges" text NOT NULL, CONSTRAINT "PK_9d73f23749dca512efc3ccbea6a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mounth" text NOT NULL, "year" text NOT NULL, "publications" integer, "videos" integer, "hours" integer NOT NULL, "revisits" integer, "studies" integer, "observations" text, "publisher_id" uuid, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_177bb9a955d0213e788592e7359" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_177bb9a955d0213e788592e7359"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TABLE "publishers"`);
    }

}
