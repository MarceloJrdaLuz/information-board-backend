"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1698805001491 = void 0;
class default1698805001491 {
    constructor() {
        this.name = 'default1698805001491';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "publications"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "videos"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "revisits"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reports" ADD "revisits" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "videos" integer`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "publications" integer`);
    }
}
exports.default1698805001491 = default1698805001491;
