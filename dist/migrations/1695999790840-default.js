"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1695999790840 = void 0;
class default1695999790840 {
    constructor() {
        this.name = 'default1695999790840';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}
exports.default1695999790840 = default1695999790840;
