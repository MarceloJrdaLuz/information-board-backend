"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAccessRequest1788556000000 = void 0;
class CreateAccessRequest1788556000000 {
    constructor() {
        this.name = 'CreateAccessRequest1788556000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."access_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELED')`);
        await queryRunner.query(`CREATE TABLE "access_requests" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "congregation_id" uuid NOT NULL,
            "status" "public"."access_requests_status_enum" NOT NULL DEFAULT 'PENDING',
            "message" text,
            "response_observation" text,
            "reviewed_by_user_id" uuid,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_access_requests_id" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "access_requests" ADD CONSTRAINT "FK_access_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_requests" ADD CONSTRAINT "FK_access_requests_congregation" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_requests" ADD CONSTRAINT "FK_access_requests_reviewed_by" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "access_requests" DROP CONSTRAINT "FK_access_requests_reviewed_by"`);
        await queryRunner.query(`ALTER TABLE "access_requests" DROP CONSTRAINT "FK_access_requests_congregation"`);
        await queryRunner.query(`ALTER TABLE "access_requests" DROP CONSTRAINT "FK_access_requests_user"`);
        await queryRunner.query(`DROP TABLE "access_requests"`);
        await queryRunner.query(`DROP TYPE "public"."access_requests_status_enum"`);
    }
}
exports.CreateAccessRequest1788556000000 = CreateAccessRequest1788556000000;
