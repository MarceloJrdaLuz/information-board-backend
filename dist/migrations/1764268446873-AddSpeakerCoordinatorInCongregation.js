"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSpeakerCoordinatorInCongregation1764268446873 = void 0;
class AddSpeakerCoordinatorInCongregation1764268446873 {
    constructor() {
        this.name = 'AddSpeakerCoordinatorInCongregation1764268446873';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" ADD "speaker_coordinator_id" uuid`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_59ed0844de744fa969d46b64be2" FOREIGN KEY ("speaker_coordinator_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_59ed0844de744fa969d46b64be2"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "speaker_coordinator_id"`);
    }
}
exports.AddSpeakerCoordinatorInCongregation1764268446873 = AddSpeakerCoordinatorInCongregation1764268446873;
