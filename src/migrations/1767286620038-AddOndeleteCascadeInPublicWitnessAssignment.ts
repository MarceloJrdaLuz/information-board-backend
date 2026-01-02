import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOndeleteCascadeInPublicWitnessAssignment1767286620038 implements MigrationInterface {
    name = 'AddOndeleteCascadeInPublicWitnessAssignment1767286620038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" DROP CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3"`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" ADD CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3" FOREIGN KEY ("time_slot_id") REFERENCES "public_witness_time_slots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" DROP CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3"`);
        await queryRunner.query(`ALTER TABLE "public_witness_assignments" ADD CONSTRAINT "FK_b94fc28f4cb6f86b46f0d2295d3" FOREIGN KEY ("time_slot_id") REFERENCES "public_witness_time_slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
