"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1739535974527 = void 0;
class default1739535974527 {
    constructor() {
        this.name = 'default1739535974527';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "territory" ADD "number" integer`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "territory" DROP COLUMN "number"`);
    }
}
exports.default1739535974527 = default1739535974527;
