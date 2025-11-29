"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOnDeleteInSpeakerCoordinate1764293681380 = void 0;
class AddOnDeleteInSpeakerCoordinate1764293681380 {
    constructor() {
        this.name = 'AddOnDeleteInSpeakerCoordinate1764293681380';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_59ed0844de744fa969d46b64be2"`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_59ed0844de744fa969d46b64be2" FOREIGN KEY ("speaker_coordinator_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_59ed0844de744fa969d46b64be2"`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_59ed0844de744fa969d46b64be2" FOREIGN KEY ("speaker_coordinator_id") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
exports.AddOnDeleteInSpeakerCoordinate1764293681380 = AddOnDeleteInSpeakerCoordinate1764293681380;
