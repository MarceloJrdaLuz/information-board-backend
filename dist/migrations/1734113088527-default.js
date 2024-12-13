"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1734113088527 = void 0;
class default1734113088527 {
    constructor() {
        this.name = 'default1734113088527';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "territory_history" ADD "work_type" character varying NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "territory_history" DROP COLUMN "work_type"`);
    }
}
exports.default1734113088527 = default1734113088527;
