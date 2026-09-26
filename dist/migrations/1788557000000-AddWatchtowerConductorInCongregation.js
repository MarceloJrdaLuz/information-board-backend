"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWatchtowerConductorInCongregation1788557000000 = void 0;
class AddWatchtowerConductorInCongregation1788557000000 {
    constructor() {
        this.name = 'AddWatchtowerConductorInCongregation1788557000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" ADD "watchtower_conductor_id" uuid`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_congregation_watchtower_conductor" FOREIGN KEY ("watchtower_conductor_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_congregation_watchtower_conductor"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "watchtower_conductor_id"`);
    }
}
exports.AddWatchtowerConductorInCongregation1788557000000 = AddWatchtowerConductorInCongregation1788557000000;
