"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddExternalTalk1758140495792 = void 0;
class AddExternalTalk1758140495792 {
    constructor() {
        this.name = 'AddExternalTalk1758140495792';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."external_talks_status_enum" AS ENUM('pending', 'confirmed', 'canceled')`);
        await queryRunner.query(`CREATE TABLE "external_talks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "manualTalk" text, "status" "public"."external_talks_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "speaker_id" uuid, "talk_id" uuid, "origin_congregation_id" uuid, "destination_congregation_id" uuid, CONSTRAINT "PK_f628b75b96f203d47181246354c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "external_talks" ADD CONSTRAINT "FK_0f76d9f64f8d36ecdd522fba4ab" FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "external_talks" ADD CONSTRAINT "FK_4181e4e00f74c9cc4e142457d3f" FOREIGN KEY ("talk_id") REFERENCES "talks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "external_talks" ADD CONSTRAINT "FK_e159fc9a917d993c9b279dba1fe" FOREIGN KEY ("origin_congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "external_talks" ADD CONSTRAINT "FK_55ff17bd3c39c2e0e0bc1671cd8" FOREIGN KEY ("destination_congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "external_talks" DROP CONSTRAINT "FK_55ff17bd3c39c2e0e0bc1671cd8"`);
        await queryRunner.query(`ALTER TABLE "external_talks" DROP CONSTRAINT "FK_e159fc9a917d993c9b279dba1fe"`);
        await queryRunner.query(`ALTER TABLE "external_talks" DROP CONSTRAINT "FK_4181e4e00f74c9cc4e142457d3f"`);
        await queryRunner.query(`ALTER TABLE "external_talks" DROP CONSTRAINT "FK_0f76d9f64f8d36ecdd522fba4ab"`);
        await queryRunner.query(`DROP TABLE "external_talks"`);
        await queryRunner.query(`DROP TYPE "public"."external_talks_status_enum"`);
    }
}
exports.AddExternalTalk1758140495792 = AddExternalTalk1758140495792;
