"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693329796778 = void 0;
class default1693329796778 {
    constructor() {
        this.name = 'default1693329796778';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher" jsonb NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher"`);
    }
}
exports.default1693329796778 = default1693329796778;
