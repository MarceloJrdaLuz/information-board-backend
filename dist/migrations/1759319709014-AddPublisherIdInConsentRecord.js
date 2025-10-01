"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPublisherIdInConsentRecord1759319709014 = void 0;
class AddPublisherIdInConsentRecord1759319709014 {
    constructor() {
        this.name = 'AddPublisherIdInConsentRecord1759319709014';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" ADD "publisher_id" uuid`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "consent-record" DROP COLUMN "publisher_id"`);
    }
}
exports.AddPublisherIdInConsentRecord1759319709014 = AddPublisherIdInConsentRecord1759319709014;
