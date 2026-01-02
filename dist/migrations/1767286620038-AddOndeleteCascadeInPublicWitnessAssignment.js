"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOndeleteCascadeInPublicWitnessAssignment1767286620038 = void 0;
class AddOndeleteCascadeInPublicWitnessAssignment1767286620038 {
    constructor() {
        this.name = 'AddOndeleteCascadeInPublicWitnessAssignment1767286620038';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" DROP CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3"`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" ADD CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3" FOREIGN KEY ("time_slot_id") REFERENCES "public_witness_time_slots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" DROP CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3"`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" ADD CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3" FOREIGN KEY ("time_slot_id") REFERENCES "public_witness_time_slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
exports.AddOndeleteCascadeInPublicWitnessAssignment1767286620038 = AddOndeleteCascadeInPublicWitnessAssignment1767286620038;
