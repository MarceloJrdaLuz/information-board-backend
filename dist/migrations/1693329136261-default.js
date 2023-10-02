"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693329136261 = void 0;
class default1693329136261 {
    constructor() {
        this.name = 'default1693329136261';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher" text NOT NULL`);
    }
}
exports.default1693329136261 = default1693329136261;
