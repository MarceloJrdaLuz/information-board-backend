"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCongregationRelation1759522953366 = void 0;
class AddCongregationRelation1759522953366 {
    constructor() {
        this.name = 'AddCongregationRelation1759522953366';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" ADD "congregation_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" ADD CONSTRAINT "FK_f85352cb972d2227c7bc051065b" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" DROP CONSTRAINT "FK_f85352cb972d2227c7bc051065b"`);
        await queryRunner.query(`ALTER TABLE "hospitality_weekend" DROP COLUMN "congregation_id"`);
    }
}
exports.AddCongregationRelation1759522953366 = AddCongregationRelation1759522953366;
