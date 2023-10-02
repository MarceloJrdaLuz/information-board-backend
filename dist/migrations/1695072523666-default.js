"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1695072523666 = void 0;
class default1695072523666 {
    constructor() {
        this.name = 'default1695072523666';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD "group_id" uuid`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_a94efe76f23f50251a2874a2593" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_a94efe76f23f50251a2874a2593"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
exports.default1695072523666 = default1695072523666;