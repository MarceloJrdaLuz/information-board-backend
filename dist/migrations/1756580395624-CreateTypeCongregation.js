"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTypeCongregation1756580395624 = void 0;
class CreateTypeCongregation1756580395624 {
    constructor() {
        this.name = 'CreateTypeCongregation1756580395624';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."congregation_type_enum" AS ENUM('system', 'auxiliary')`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "type" "public"."congregation_type_enum" NOT NULL DEFAULT 'system'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."congregation_type_enum"`);
    }
}
exports.CreateTypeCongregation1756580395624 = CreateTypeCongregation1756580395624;
