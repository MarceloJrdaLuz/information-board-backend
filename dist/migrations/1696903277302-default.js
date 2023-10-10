"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1696903277302 = void 0;
class default1696903277302 {
    constructor() {
        this.name = 'default1696903277302';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" text`);
    }
}
exports.default1696903277302 = default1696903277302;
