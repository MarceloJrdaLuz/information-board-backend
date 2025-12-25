"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFieldServiceEntities1766502447715 = void 0;
class CreateFieldServiceEntities1766502447715 {
    constructor() {
        this.name = 'CreateFieldServiceEntities1766502447715';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."field_service_templates_type_enum" AS ENUM('FIXED', 'ROTATION')`);
        await queryRunner.query(`CREATE TABLE "field_service_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "congregation_id" uuid NOT NULL, "type" "public"."field_service_templates_type_enum" NOT NULL, "weekday" integer NOT NULL, "time" TIME NOT NULL, "location" character varying NOT NULL, "leader_id" uuid, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d9e275f1a2e16af3e7d19749d12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "field_service_rotation_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "publisher_id" uuid NOT NULL, "order" integer NOT NULL, "template_id" uuid, CONSTRAINT "PK_1ecfa3fbcdee1e2add20dfe6d33" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "field_service_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template_id" uuid NOT NULL, "date" date NOT NULL, "leader_id" uuid NOT NULL, CONSTRAINT "PK_08d74b2c44686364d5b67a642db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "field_service_exceptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "congregation_id" uuid NOT NULL, "template_id" uuid, "date" date NOT NULL, "reason" character varying, CONSTRAINT "PK_5d82b1b026faba65989ae01d0a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff218e0e48b26283d5bb990f32" ON "field_service_exceptions" ("template_id", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_2603ce45cbf89efac0dd19d6d4" ON "field_service_exceptions" ("congregation_id", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_dbc0384fed6dec83217f08d75e" ON "field_service_exceptions" ("date") `);
        await queryRunner.query(`ALTER TABLE "field_service_templates" ADD CONSTRAINT "FK_b74345ef4a917a93fff41324d3e" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_service_templates" ADD CONSTRAINT "FK_182ced91365ad68727585d2b5f7" FOREIGN KEY ("leader_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_service_rotation_members" ADD CONSTRAINT "FK_8d99946890cb1e42bb97bd727b5" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_service_rotation_members" ADD CONSTRAINT "FK_4c5fc6ae8dedd1c1443ccff49b6" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" ADD CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" ADD CONSTRAINT "FK_a5727ceec55fd96edee56070ea2" FOREIGN KEY ("leader_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_service_exceptions" ADD CONSTRAINT "FK_f51158124c0f934ef655d277513" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "field_service_exceptions" ADD CONSTRAINT "FK_892531830b9d1c15bcbd6a74612" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "field_service_exceptions" DROP CONSTRAINT "FK_892531830b9d1c15bcbd6a74612"`);
        await queryRunner.query(`ALTER TABLE "field_service_exceptions" DROP CONSTRAINT "FK_f51158124c0f934ef655d277513"`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" DROP CONSTRAINT "FK_a5727ceec55fd96edee56070ea2"`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" DROP CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36"`);
        await queryRunner.query(`ALTER TABLE "field_service_rotation_members" DROP CONSTRAINT "FK_4c5fc6ae8dedd1c1443ccff49b6"`);
        await queryRunner.query(`ALTER TABLE "field_service_rotation_members" DROP CONSTRAINT "FK_8d99946890cb1e42bb97bd727b5"`);
        await queryRunner.query(`ALTER TABLE "field_service_templates" DROP CONSTRAINT "FK_182ced91365ad68727585d2b5f7"`);
        await queryRunner.query(`ALTER TABLE "field_service_templates" DROP CONSTRAINT "FK_b74345ef4a917a93fff41324d3e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dbc0384fed6dec83217f08d75e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2603ce45cbf89efac0dd19d6d4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff218e0e48b26283d5bb990f32"`);
        await queryRunner.query(`DROP TABLE "field_service_exceptions"`);
        await queryRunner.query(`DROP TABLE "field_service_schedules"`);
        await queryRunner.query(`DROP TABLE "field_service_rotation_members"`);
        await queryRunner.query(`DROP TABLE "field_service_templates"`);
        await queryRunner.query(`DROP TYPE "public"."field_service_templates_type_enum"`);
    }
}
exports.CreateFieldServiceEntities1766502447715 = CreateFieldServiceEntities1766502447715;
