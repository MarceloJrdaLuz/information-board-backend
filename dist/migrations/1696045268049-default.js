"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1696045268049 = void 0;
class default1696045268049 {
    constructor() {
        this.name = 'default1696045268049';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000"`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "groupOverseers" DROP CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04"`);
        await queryRunner.query(`ALTER TABLE "groupOverseers" ADD CONSTRAINT "FK_7c1b41a4c5d6929ae65f883d000" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_9487da8f5ea811ce9684be6fa04" FOREIGN KEY ("group_overseers_id") REFERENCES "groupOverseers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
exports.default1696045268049 = default1696045268049;
