"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1694463472061 = void 0;
class default1694463472061 {
    constructor() {
        this.name = 'default1694463472061';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "notices" ADD "startDay" integer`);
        await queryRunner.query(`ALTER TABLE "notices" ADD "endDay" integer`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "endDay"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "startDay"`);
    }
}
exports.default1694463472061 = default1694463472061;
