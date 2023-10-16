"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1697395512292 = void 0;
class default1697395512292 {
    constructor() {
        this.name = 'default1697395512292';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "lastName"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "profile" ADD "lastName" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "name" text NOT NULL`);
    }
}
exports.default1697395512292 = default1697395512292;
