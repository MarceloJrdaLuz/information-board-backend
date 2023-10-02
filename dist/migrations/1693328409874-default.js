"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693328409874 = void 0;
class default1693328409874 {
    constructor() {
        this.name = 'default1693328409874';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "fullName" TO "publisher"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" RENAME COLUMN "publisher" TO "fullName"`);
    }
}
exports.default1693328409874 = default1693328409874;
