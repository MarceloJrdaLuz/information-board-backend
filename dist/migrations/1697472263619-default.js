"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1697472263619 = void 0;
class default1697472263619 {
    constructor() {
        this.name = 'default1697472263619';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD "profile_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_23371445bd80cb3e413089551bf" UNIQUE ("profile_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_23371445bd80cb3e413089551bf" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_23371445bd80cb3e413089551bf"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_23371445bd80cb3e413089551bf"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_id"`);
    }
}
exports.default1697472263619 = default1697472263619;
