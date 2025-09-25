"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddHospitalityAssignmentAndWeekendHospitality1758722364612 = void 0;
class AddHospitalityAssignmentAndWeekendHospitality1758722364612 {
    constructor() {
        this.name = 'AddHospitalityAssignmentAndWeekendHospitality1758722364612';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "hospitality_weekend" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cdaa9ff9cfe53d2b565d8eea41d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."hospitality_assignment_eventtype_enum" AS ENUM('DINNER', 'LUNCH', 'HOSTING')`);
        await queryRunner.query(`CREATE TABLE "hospitality_assignment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "eventType" "public"."hospitality_assignment_eventtype_enum" NOT NULL, "completed" boolean, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "weekend_id" uuid, "group_id" uuid, CONSTRAINT "PK_f24b57a4e869aefdf145b8ff29b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hospitality_assignment" ADD CONSTRAINT "FK_496089e81d80e77972c0ea01aa4" FOREIGN KEY ("weekend_id") REFERENCES "hospitality_weekend"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hospitality_assignment" ADD CONSTRAINT "FK_3edeac9bf077a533d99eb7b05b1" FOREIGN KEY ("group_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "hospitality_assignment" DROP CONSTRAINT "FK_3edeac9bf077a533d99eb7b05b1"`);
        await queryRunner.query(`ALTER TABLE "hospitality_assignment" DROP CONSTRAINT "FK_496089e81d80e77972c0ea01aa4"`);
        await queryRunner.query(`DROP TABLE "hospitality_assignment"`);
        await queryRunner.query(`DROP TYPE "public"."hospitality_assignment_eventtype_enum"`);
        await queryRunner.query(`DROP TABLE "hospitality_weekend"`);
    }
}
exports.AddHospitalityAssignmentAndWeekendHospitality1758722364612 = AddHospitalityAssignmentAndWeekendHospitality1758722364612;
