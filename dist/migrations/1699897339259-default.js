"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1699897339259 = void 0;
class default1699897339259 {
    constructor() {
        this.name = 'default1699897339259';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "assistance" ADD "midWeekTotal" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assistance" ADD "midWeekAverage" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assistance" ADD "endWeekTotal" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assistance" ADD "endWeekAverage" integer NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "endWeekAverage"`);
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "endWeekTotal"`);
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "midWeekAverage"`);
        await queryRunner.query(`ALTER TABLE "assistance" DROP COLUMN "midWeekTotal"`);
    }
}
exports.default1699897339259 = default1699897339259;
