"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693264887365 = void 0;
class default1693264887365 {
    constructor() {
        this.name = 'default1693264887365';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "ip" TO "deviceId"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "deviceId" TO "ip"`);
    }
}
exports.default1693264887365 = default1693264887365;
