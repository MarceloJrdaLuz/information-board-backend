"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFieldServiceTemplateLocationOverride1767887613003 = void 0;
class AddFieldServiceTemplateLocationOverride1767887613003 {
    constructor() {
        this.name = 'AddFieldServiceTemplateLocationOverride1767887613003';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "field_service_template_location_overrides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template_id" uuid NOT NULL, "week_start" date NOT NULL, "location" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eb36149b04059426697c54c0da7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a37a3aa03cff23d03e73dea9d1" ON "field_service_template_location_overrides" ("template_id", "week_start") `);
        await queryRunner.query(`ALTER TABLE "field_service_template_location_overrides" ADD CONSTRAINT "FK_ce6b127559098bd5a9171657b93" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "field_service_template_location_overrides" DROP CONSTRAINT "FK_ce6b127559098bd5a9171657b93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a37a3aa03cff23d03e73dea9d1"`);
        await queryRunner.query(`DROP TABLE "field_service_template_location_overrides"`);
    }
}
exports.AddFieldServiceTemplateLocationOverride1767887613003 = AddFieldServiceTemplateLocationOverride1767887613003;
