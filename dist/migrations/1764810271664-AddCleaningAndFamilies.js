"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCleaningAndFamilies1764810271664 = void 0;
class AddCleaningAndFamilies1764810271664 {
    constructor() {
        this.name = 'AddCleaningAndFamilies1764810271664';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "families" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "congregation_id" uuid, "responsible_publisher_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_70414ac0c8f45664cf71324b9bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cleaning_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "name" character varying NOT NULL, "congregationId" uuid, CONSTRAINT "PK_c7b7b1a9a42e697c0ccb103036f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cleaning_schedule_config_mode_enum" AS ENUM('WEEKLY', 'MEETINGS')`);
        await queryRunner.query(`CREATE TABLE "cleaning_schedule_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mode" "public"."cleaning_schedule_config_mode_enum" NOT NULL DEFAULT 'WEEKLY', "congregationId" uuid, CONSTRAINT "REL_ee12168d8144004cb0f592f0b8" UNIQUE ("congregationId"), CONSTRAINT "PK_3cf70818ab7f45af6b53d436457" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cleaning_exception" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "reason" character varying, "congregationId" uuid, CONSTRAINT "PK_973ca7a125ebc25868ed753e4b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cleaning_schedule" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "congregation_id" uuid NOT NULL, "group_id" uuid NOT NULL, "date" date NOT NULL, CONSTRAINT "PK_ec4f9bc2224a13917c7ae059dc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cleaning_group_publishers_publishers" ("cleaningGroupId" uuid NOT NULL, "publishersId" uuid NOT NULL, CONSTRAINT "PK_f630ea4acbd9128c32ec59acc2b" PRIMARY KEY ("cleaningGroupId", "publishersId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bacae050fa8b2d4bb9295f8252" ON "cleaning_group_publishers_publishers" ("cleaningGroupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6f5aa8114f642ba8fa40cb963a" ON "cleaning_group_publishers_publishers" ("publishersId") `);
        await queryRunner.query(`ALTER TABLE "publishers" ADD "family_id" uuid`);
        await queryRunner.query(`ALTER TABLE "families" ADD CONSTRAINT "FK_62e86cb97d1269f10eca082cbe8" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "families" ADD CONSTRAINT "FK_7c713a4cd0afad96e9071a2bc11" FOREIGN KEY ("responsible_publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_1c323eff2662e2bfaecc0ceb1f1" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cleaning_group" ADD CONSTRAINT "FK_f81a86e440c12a069bd4beeeb72" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cleaning_schedule_config" ADD CONSTRAINT "FK_ee12168d8144004cb0f592f0b8a" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cleaning_exception" ADD CONSTRAINT "FK_99e50be4b66a48ce94f06fa6723" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cleaning_schedule" ADD CONSTRAINT "FK_6acbcd02f2a4f54b8a514c2e0b6" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cleaning_schedule" ADD CONSTRAINT "FK_7097a48e6e06c8260a77c74d3a9" FOREIGN KEY ("group_id") REFERENCES "cleaning_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cleaning_group_publishers_publishers" ADD CONSTRAINT "FK_bacae050fa8b2d4bb9295f8252f" FOREIGN KEY ("cleaningGroupId") REFERENCES "cleaning_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "cleaning_group_publishers_publishers" ADD CONSTRAINT "FK_6f5aa8114f642ba8fa40cb963a8" FOREIGN KEY ("publishersId") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "cleaning_group_publishers_publishers" DROP CONSTRAINT "FK_6f5aa8114f642ba8fa40cb963a8"`);
        await queryRunner.query(`ALTER TABLE "cleaning_group_publishers_publishers" DROP CONSTRAINT "FK_bacae050fa8b2d4bb9295f8252f"`);
        await queryRunner.query(`ALTER TABLE "cleaning_schedule" DROP CONSTRAINT "FK_7097a48e6e06c8260a77c74d3a9"`);
        await queryRunner.query(`ALTER TABLE "cleaning_schedule" DROP CONSTRAINT "FK_6acbcd02f2a4f54b8a514c2e0b6"`);
        await queryRunner.query(`ALTER TABLE "cleaning_exception" DROP CONSTRAINT "FK_99e50be4b66a48ce94f06fa6723"`);
        await queryRunner.query(`ALTER TABLE "cleaning_schedule_config" DROP CONSTRAINT "FK_ee12168d8144004cb0f592f0b8a"`);
        await queryRunner.query(`ALTER TABLE "cleaning_group" DROP CONSTRAINT "FK_f81a86e440c12a069bd4beeeb72"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_1c323eff2662e2bfaecc0ceb1f1"`);
        await queryRunner.query(`ALTER TABLE "families" DROP CONSTRAINT "FK_7c713a4cd0afad96e9071a2bc11"`);
        await queryRunner.query(`ALTER TABLE "families" DROP CONSTRAINT "FK_62e86cb97d1269f10eca082cbe8"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "family_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f5aa8114f642ba8fa40cb963a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bacae050fa8b2d4bb9295f8252"`);
        await queryRunner.query(`DROP TABLE "cleaning_group_publishers_publishers"`);
        await queryRunner.query(`DROP TABLE "cleaning_schedule"`);
        await queryRunner.query(`DROP TABLE "cleaning_exception"`);
        await queryRunner.query(`DROP TABLE "cleaning_schedule_config"`);
        await queryRunner.query(`DROP TYPE "public"."cleaning_schedule_config_mode_enum"`);
        await queryRunner.query(`DROP TABLE "cleaning_group"`);
        await queryRunner.query(`DROP TABLE "families"`);
    }
}
exports.AddCleaningAndFamilies1764810271664 = AddCleaningAndFamilies1764810271664;
