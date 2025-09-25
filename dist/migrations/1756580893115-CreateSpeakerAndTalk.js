"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSpeakerAndTalk1756580893115 = void 0;
class CreateSpeakerAndTalk1756580893115 {
    constructor() {
        this.name = 'CreateSpeakerAndTalk1756580893115';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "talks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number" integer NOT NULL, "title" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_66555ca66ecea3b29a5d35b6bb0" UNIQUE ("number"), CONSTRAINT "PK_40335c0a4082e2e036902ac9d3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "speakers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" text NOT NULL, "phone" text, "address" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "congregation_id" uuid, "publisher_id" uuid, CONSTRAINT "PK_b3818c94af77a0cf73403ecef14" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "speakers_talks" ("speaker_id" uuid NOT NULL, "talk_id" uuid NOT NULL, CONSTRAINT "PK_f8428251529a0697d0a86c6fd36" PRIMARY KEY ("speaker_id", "talk_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_299c6274568ad91d9bedcb63c6" ON "speakers_talks" ("speaker_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a59c0e48865e4c27e2137a4b37" ON "speakers_talks" ("talk_id") `);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD CONSTRAINT "FK_46fe6c5cfaf8b360c5c48e2899f" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "speakers" ADD CONSTRAINT "FK_86bb0759b9503f0115d161051d5" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "speakers_talks" ADD CONSTRAINT "FK_299c6274568ad91d9bedcb63c64" FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "speakers_talks" ADD CONSTRAINT "FK_a59c0e48865e4c27e2137a4b377" FOREIGN KEY ("talk_id") REFERENCES "talks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "speakers_talks" DROP CONSTRAINT "FK_a59c0e48865e4c27e2137a4b377"`);
        await queryRunner.query(`ALTER TABLE "speakers_talks" DROP CONSTRAINT "FK_299c6274568ad91d9bedcb63c64"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP CONSTRAINT "FK_86bb0759b9503f0115d161051d5"`);
        await queryRunner.query(`ALTER TABLE "speakers" DROP CONSTRAINT "FK_46fe6c5cfaf8b360c5c48e2899f"`);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "type" SET DEFAULT 'system'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a59c0e48865e4c27e2137a4b37"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_299c6274568ad91d9bedcb63c6"`);
        await queryRunner.query(`DROP TABLE "speakers_talks"`);
        await queryRunner.query(`DROP TABLE "speakers"`);
        await queryRunner.query(`DROP TABLE "talks"`);
    }
}
exports.CreateSpeakerAndTalk1756580893115 = CreateSpeakerAndTalk1756580893115;
