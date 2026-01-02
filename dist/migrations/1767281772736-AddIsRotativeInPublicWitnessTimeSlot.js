"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddIsRotativeInPublicWitnessTimeSlot1767281772736 = void 0;
class AddIsRotativeInPublicWitnessTimeSlot1767281772736 {
    constructor() {
        this.name = 'AddIsRotativeInPublicWitnessTimeSlot1767281772736';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "public_witness_time_slots" ADD "is_rotative" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "public_witness_time_slots" DROP COLUMN "is_rotative"`);
    }
}
exports.AddIsRotativeInPublicWitnessTimeSlot1767281772736 = AddIsRotativeInPublicWitnessTimeSlot1767281772736;
