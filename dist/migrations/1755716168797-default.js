"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1755716168797 = void 0;
class default1755716168797 {
    constructor() {
        this.name = 'default1755716168797';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "emergency_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "phone" text NOT NULL, "relationship" text, "isTj" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_8be191845b6fca1c4e5ba5bd7d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "publisher_emergency_contacts" ("publisher_id" uuid NOT NULL, "emergency_contact_id" uuid NOT NULL, CONSTRAINT "PK_558de9e05d65bc7dd00f14099dd" PRIMARY KEY ("publisher_id", "emergency_contact_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0a6d695487e50dced5f790269c" ON "publisher_emergency_contacts" ("publisher_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2a88f05ac346107f5a3513375f" ON "publisher_emergency_contacts" ("emergency_contact_id") `);
        await queryRunner.query(`ALTER TABLE "publishers" ADD "address" text`);
        await queryRunner.query(`ALTER TABLE "publisher_emergency_contacts" ADD CONSTRAINT "FK_0a6d695487e50dced5f790269c1" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "publisher_emergency_contacts" ADD CONSTRAINT "FK_2a88f05ac346107f5a3513375f4" FOREIGN KEY ("emergency_contact_id") REFERENCES "emergency_contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_emergency_contacts" DROP CONSTRAINT "FK_2a88f05ac346107f5a3513375f4"`);
        await queryRunner.query(`ALTER TABLE "publisher_emergency_contacts" DROP CONSTRAINT "FK_0a6d695487e50dced5f790269c1"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "address"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2a88f05ac346107f5a3513375f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0a6d695487e50dced5f790269c"`);
        await queryRunner.query(`DROP TABLE "publisher_emergency_contacts"`);
        await queryRunner.query(`DROP TABLE "emergency_contacts"`);
    }
}
exports.default1755716168797 = default1755716168797;
