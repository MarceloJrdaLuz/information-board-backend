"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693847511112 = void 0;
class default1693847511112 {
    constructor() {
        this.name = 'default1693847511112';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP COLUMN "phone"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD "phone" text NOT NULL`);
    }
}
exports.default1693847511112 = default1693847511112;
