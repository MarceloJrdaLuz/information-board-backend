"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddNotification1786363386953 = void 0;
class AddNotification1786363386953 {
    constructor() {
        this.name = 'AddNotification1786363386953';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('HOSPITALITY', 'SPEAKER', 'PUBLICWITNESS', 'FIELD_SERVICE', 'CLEANING', 'READING', 'CHAIRMAN', 'REMINDER')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" text NOT NULL, "body" text NOT NULL, "scheduled_at" TIMESTAMP, "sent_at" TIMESTAMP, "read_at" TIMESTAMP, "data" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }
}
exports.AddNotification1786363386953 = AddNotification1786363386953;
