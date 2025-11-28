import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpeakerCoordinatorInCongregation1764268446873 implements MigrationInterface {
    name = 'AddSpeakerCoordinatorInCongregation1764268446873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" ADD "speaker_coordinator_id" uuid`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_59ed0844de744fa969d46b64be2" FOREIGN KEY ("speaker_coordinator_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_59ed0844de744fa969d46b64be2"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "speaker_coordinator_id"`);
    }

}
