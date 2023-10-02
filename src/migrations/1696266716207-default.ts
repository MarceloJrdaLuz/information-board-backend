import { MigrationInterface, QueryRunner } from "typeorm";

export class default1696266716207 implements MigrationInterface {
    name = 'default1696266716207'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000"`);
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`CREATE TABLE "consent-record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" text NOT NULL, "nickname" text NOT NULL, "congregation_id" text NOT NULL, "deviceId" text NOT NULL, "consentDate" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c4af1c65d56f6c6070c2293f27" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "notices" ADD "startDay" integer`);
        await queryRunner.query(`ALTER TABLE "notices" ADD "endDay" integer`);
        await queryRunner.query(`ALTER TABLE "notices" ADD "expired" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "imageKey" text`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD "phone" text`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD "group_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6"`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "congregation_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "image_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6"`);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "image_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "congregation_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "imageKey"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "expired"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "endDay"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "startDay"`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD "phone" text NOT NULL`);
        await queryRunner.query(`DROP TABLE "consent-record"`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
