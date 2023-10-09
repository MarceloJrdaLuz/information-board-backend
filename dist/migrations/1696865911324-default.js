"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1696865911324 = void 0;
class default1696865911324 {
    constructor() {
        this.name = 'default1696865911324';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" ADD "birthDate" TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "birthDate"`);
    }
}
exports.default1696865911324 = default1696865911324;
