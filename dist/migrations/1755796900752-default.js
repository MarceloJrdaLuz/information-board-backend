"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1755796900752 = void 0;
class default1755796900752 {
    constructor() {
        this.name = 'default1755796900752';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emergency_contacts" ADD "congregationId" uuid`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" ADD CONSTRAINT "FK_15b8cdbf66d3bd08cdc6bdbeade" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emergency_contacts" DROP CONSTRAINT "FK_15b8cdbf66d3bd08cdc6bdbeade"`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" DROP COLUMN "congregationId"`);
    }
}
exports.default1755796900752 = default1755796900752;
