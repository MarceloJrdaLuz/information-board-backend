"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1696903384789 = void 0;
class default1696903384789 {
    constructor() {
        this.name = 'default1696903384789';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" text`);
    }
}
exports.default1696903384789 = default1696903384789;
