"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEventAndNoMeetingToMechanicalSchedule1787460000000 = void 0;
const typeorm_1 = require("typeorm");
class AddEventAndNoMeetingToMechanicalSchedule1787460000000 {
    constructor() {
        this.name = "AddEventAndNoMeetingToMechanicalSchedule1787460000000";
    }
    async up(queryRunner) {
        const hasNoMeeting = await queryRunner.hasColumn("mechanical_schedules", "hasNoMeeting");
        if (!hasNoMeeting) {
            await queryRunner.addColumn("mechanical_schedules", new typeorm_1.TableColumn({
                name: "hasNoMeeting",
                type: "boolean",
                default: false
            }));
        }
        const hasEventTitle = await queryRunner.hasColumn("mechanical_schedules", "eventTitle");
        if (!hasEventTitle) {
            await queryRunner.addColumn("mechanical_schedules", new typeorm_1.TableColumn({
                name: "eventTitle",
                type: "text",
                isNullable: true
            }));
        }
    }
    async down(queryRunner) {
        if (await queryRunner.hasColumn("mechanical_schedules", "eventTitle")) {
            await queryRunner.dropColumn("mechanical_schedules", "eventTitle");
        }
        if (await queryRunner.hasColumn("mechanical_schedules", "hasNoMeeting")) {
            await queryRunner.dropColumn("mechanical_schedules", "hasNoMeeting");
        }
    }
}
exports.AddEventAndNoMeetingToMechanicalSchedule1787460000000 = AddEventAndNoMeetingToMechanicalSchedule1787460000000;
