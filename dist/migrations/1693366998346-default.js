"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693366998346 = void 0;
class default1693366998346 {
    constructor() {
        this.name = 'default1693366998346';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher"`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "fullName" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "nickname" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "congregation_id" text NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "congregation_id"`);
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "nickname"`);
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher" jsonb NOT NULL`);
    }
}
exports.default1693366998346 = default1693366998346;
