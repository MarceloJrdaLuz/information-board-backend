"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAddressAndGpsInCongregation1764170990230 = void 0;
class AddAddressAndGpsInCongregation1764170990230 {
    constructor() {
        this.name = 'AddAddressAndGpsInCongregation1764170990230';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" ADD "latitude" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "longitude" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "address" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "latitude"`);
    }
}
exports.AddAddressAndGpsInCongregation1764170990230 = AddAddressAndGpsInCongregation1764170990230;
