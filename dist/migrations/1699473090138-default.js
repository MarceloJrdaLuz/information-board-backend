"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1699473090138 = void 0;
class default1699473090138 {
    constructor() {
        this.name = 'default1699473090138';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reports" RENAME COLUMN "privilege" TO "privileges"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reports" RENAME COLUMN "privileges" TO "privilege"`);
    }
}
exports.default1699473090138 = default1699473090138;
