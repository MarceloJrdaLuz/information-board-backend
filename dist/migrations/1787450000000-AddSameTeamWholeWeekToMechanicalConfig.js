"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSameTeamWholeWeekToMechanicalConfig1787450000000 = void 0;
const typeorm_1 = require("typeorm");
class AddSameTeamWholeWeekToMechanicalConfig1787450000000 {
    constructor() {
        this.name = "AddSameTeamWholeWeekToMechanicalConfig1787450000000";
    }
    async up(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("mechanical_schedule_config", "sameTeamWholeWeek");
        if (!hasColumn) {
            await queryRunner.addColumn("mechanical_schedule_config", new typeorm_1.TableColumn({
                name: "sameTeamWholeWeek",
                type: "boolean",
                default: false
            }));
        }
    }
    async down(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("mechanical_schedule_config", "sameTeamWholeWeek");
        if (hasColumn) {
            await queryRunner.dropColumn("mechanical_schedule_config", "sameTeamWholeWeek");
        }
    }
}
exports.AddSameTeamWholeWeekToMechanicalConfig1787450000000 = AddSameTeamWholeWeekToMechanicalConfig1787450000000;
