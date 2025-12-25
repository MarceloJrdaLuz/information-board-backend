"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOnDeleteCascadeInFieldServiceSchedule1766545920793 = void 0;
class AddOnDeleteCascadeInFieldServiceSchedule1766545920793 {
    constructor() {
        this.name = 'AddOnDeleteCascadeInFieldServiceSchedule1766545920793';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "field_service_schedules" DROP CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36"`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" ADD CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "field_service_schedules" DROP CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36"`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" ADD CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
exports.AddOnDeleteCascadeInFieldServiceSchedule1766545920793 = AddOnDeleteCascadeInFieldServiceSchedule1766545920793;
