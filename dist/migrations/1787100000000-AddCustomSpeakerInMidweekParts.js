"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCustomSpeakerInMidweekParts1787100000000 = void 0;
const typeorm_1 = require("typeorm");
class AddCustomSpeakerInMidweekParts1787100000000 {
    async up(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("midweek_meeting_parts", "custom_speaker_name");
        if (!hasColumn) {
            await queryRunner.addColumn("midweek_meeting_parts", new typeorm_1.TableColumn({
                name: "custom_speaker_name",
                type: "varchar",
                isNullable: true
            }));
        }
    }
    async down(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("midweek_meeting_parts", "custom_speaker_name");
        if (hasColumn) {
            await queryRunner.dropColumn("midweek_meeting_parts", "custom_speaker_name");
        }
    }
}
exports.AddCustomSpeakerInMidweekParts1787100000000 = AddCustomSpeakerInMidweekParts1787100000000;
