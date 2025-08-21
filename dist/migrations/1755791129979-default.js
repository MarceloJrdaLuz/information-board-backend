"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1755791129979 = void 0;
class default1755791129979 {
    constructor() {
        this.name = 'default1755791129979';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" ADD "emergencyContactId" uuid`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_c40b64b5864b8fa7508697c7e4c" FOREIGN KEY ("emergencyContactId") REFERENCES "emergency_contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_c40b64b5864b8fa7508697c7e4c"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "emergencyContactId"`);
    }
}
exports.default1755791129979 = default1755791129979;
