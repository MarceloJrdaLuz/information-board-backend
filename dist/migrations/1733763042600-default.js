"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1733763042600 = void 0;
class default1733763042600 {
    constructor() {
        this.name = 'default1733763042600';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "UQ_16535bb7161972fb121eef4522a" UNIQUE ("publisher_id", "month", "year")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "UQ_16535bb7161972fb121eef4522a"`);
    }
}
exports.default1733763042600 = default1733763042600;
