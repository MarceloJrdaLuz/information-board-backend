"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1696000315351 = void 0;
class default1696000315351 {
    constructor() {
        this.name = 'default1696000315351';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}
exports.default1696000315351 = default1696000315351;
