import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnDeleteCascadeInFieldServiceSchedule1766545920793 implements MigrationInterface {
    name = 'AddOnDeleteCascadeInFieldServiceSchedule1766545920793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "field_service_schedules" DROP CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36"`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" ADD CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "field_service_schedules" DROP CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36"`);
        await queryRunner.query(`ALTER TABLE "field_service_schedules" ADD CONSTRAINT "FK_9f97295d59b8a2e098ebdae3e36" FOREIGN KEY ("template_id") REFERENCES "field_service_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
