"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1696008711580 = void 0;
class default1696008711580 {
    constructor() {
        this.name = 'default1696008711580';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_5e3c164cf8605916c1bd133456f"`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_5e3c164cf8605916c1bd133456f" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
exports.default1696008711580 = default1696008711580;
