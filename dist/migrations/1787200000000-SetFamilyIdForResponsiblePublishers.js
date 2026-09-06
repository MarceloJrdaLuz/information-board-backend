"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetFamilyIdForResponsiblePublishers1787200000000 = void 0;
class SetFamilyIdForResponsiblePublishers1787200000000 {
    async up(queryRunner) {
        await queryRunner.query(`
            UPDATE "publishers"
            SET "family_id" = "families"."id"
            FROM "families"
            WHERE "publishers"."id" = "families"."responsible_publisher_id"
              AND "publishers"."family_id" IS NULL
        `);
    }
    async down(queryRunner) {
        // No-op or optional rollback
    }
}
exports.SetFamilyIdForResponsiblePublishers1787200000000 = SetFamilyIdForResponsiblePublishers1787200000000;
