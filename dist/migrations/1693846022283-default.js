"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693846022283 = void 0;
class default1693846022283 {
    constructor() {
        this.name = 'default1693846022283';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" ADD "phone" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "phone"`);
    }
}
exports.default1693846022283 = default1693846022283;
