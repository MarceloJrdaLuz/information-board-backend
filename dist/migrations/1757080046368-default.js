"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1757080046368 = void 0;
class default1757080046368 {
    constructor() {
        this.name = 'default1757080046368';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a6106a6056dba84f59bf16fed65"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP CONSTRAINT "FK_46fe6c5cfaf8b360c5c48e2899f"`);
        await queryRunner.query(`ALTER TABLE "special_weekend_events" DROP CONSTRAINT "FK_66df5b93177120ed6fa4053321f"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP CONSTRAINT "FK_907d8e40580ef834195ad29aa5c"`);
        await queryRunner.query(`ALTER TABLE "publishers" RENAME COLUMN "group_hospitality_id" TO "hospitality_group_id"`);
        await queryRunner.query(`ALTER TABLE "special_weekend_events" RENAME COLUMN "group_hospitality_id" TO "hospitality_group_id"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" RENAME COLUMN "group_hospitality_id" TO "hospitality_group_id"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP COLUMN "congregation_id"`);
        await queryRunner.query(`ALTER TABLE "hospitality_group" ADD "name" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "creator_congregation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD "creator_congregation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD "origin_congregation_id" uuid`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_speaker_name_publisher_creator" ON "speakers" ("fullName", "publisher_id", "creator_congregation_id") `);
        await queryRunner.query(`ALTER TABLE "hospitality_group" ADD CONSTRAINT "UQ_3d36a7b55b9850536207252ed5a" UNIQUE ("congregation_id", "name")`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_7b73e62f2038ac577992f24a1b9" FOREIGN KEY ("hospitality_group_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_6aa86fc232cb42bcc3e549a53ac" FOREIGN KEY ("creator_congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD CONSTRAINT "FK_2c63177bdd81ebf712152f169db" FOREIGN KEY ("creator_congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD CONSTRAINT "FK_d3c4ceb88d656e78bbdf6ce8a8c" FOREIGN KEY ("origin_congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "special_weekend_events" ADD CONSTRAINT "FK_e41afa4396a1fd55141abf5cc30" FOREIGN KEY ("hospitality_group_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD CONSTRAINT "FK_13fe1c03e4034441266cae794a3" FOREIGN KEY ("hospitality_group_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "weekend_schedules" DROP CONSTRAINT "FK_13fe1c03e4034441266cae794a3"`);
        await queryRunner.query(`ALTER TABLE "special_weekend_events" DROP CONSTRAINT "FK_e41afa4396a1fd55141abf5cc30"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP CONSTRAINT "FK_d3c4ceb88d656e78bbdf6ce8a8c"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP CONSTRAINT "FK_2c63177bdd81ebf712152f169db"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_6aa86fc232cb42bcc3e549a53ac"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_7b73e62f2038ac577992f24a1b9"`);
        await queryRunner.query(`ALTER TABLE "hospitality_group" DROP CONSTRAINT "UQ_3d36a7b55b9850536207252ed5a"`);
        await queryRunner.query(`DROP INDEX "public"."uq_speaker_name_publisher_creator"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP COLUMN "origin_congregation_id"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP COLUMN "creator_congregation_id"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "creator_congregation_id"`);
        await queryRunner.query(`ALTER TABLE "hospitality_group" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD "congregation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" RENAME COLUMN "hospitality_group_id" TO "group_hospitality_id"`);
        await queryRunner.query(`ALTER TABLE "special_weekend_events" RENAME COLUMN "hospitality_group_id" TO "group_hospitality_id"`);
        await queryRunner.query(`ALTER TABLE "publishers" RENAME COLUMN "hospitality_group_id" TO "group_hospitality_id"`);
        await queryRunner.query(`ALTER TABLE "weekend_schedules" ADD CONSTRAINT "FK_907d8e40580ef834195ad29aa5c" FOREIGN KEY ("group_hospitality_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "special_weekend_events" ADD CONSTRAINT "FK_66df5b93177120ed6fa4053321f" FOREIGN KEY ("group_hospitality_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD CONSTRAINT "FK_46fe6c5cfaf8b360c5c48e2899f" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a6106a6056dba84f59bf16fed65" FOREIGN KEY ("group_hospitality_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}
exports.default1757080046368 = default1757080046368;
