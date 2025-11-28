import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnDeleteInSpeakerCoordinate1764293681380 implements MigrationInterface {
    name = 'AddOnDeleteInSpeakerCoordinate1764293681380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_59ed0844de744fa969d46b64be2"`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_59ed0844de744fa969d46b64be2" FOREIGN KEY ("speaker_coordinator_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_59ed0844de744fa969d46b64be2"`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_59ed0844de744fa969d46b64be2" FOREIGN KEY ("speaker_coordinator_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
