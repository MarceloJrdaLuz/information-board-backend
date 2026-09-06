import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEventAndNoMeetingToMechanicalSchedule1787460000000 implements MigrationInterface {
    name = "AddEventAndNoMeetingToMechanicalSchedule1787460000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasNoMeeting = await queryRunner.hasColumn("mechanical_schedules", "hasNoMeeting");
        if (!hasNoMeeting) {
            await queryRunner.addColumn(
                "mechanical_schedules",
                new TableColumn({
                    name: "hasNoMeeting",
                    type: "boolean",
                    default: false
                })
            );
        }

        const hasEventTitle = await queryRunner.hasColumn("mechanical_schedules", "eventTitle");
        if (!hasEventTitle) {
            await queryRunner.addColumn(
                "mechanical_schedules",
                new TableColumn({
                    name: "eventTitle",
                    type: "text",
                    isNullable: true
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasColumn("mechanical_schedules", "eventTitle")) {
            await queryRunner.dropColumn("mechanical_schedules", "eventTitle");
        }
        if (await queryRunner.hasColumn("mechanical_schedules", "hasNoMeeting")) {
            await queryRunner.dropColumn("mechanical_schedules", "hasNoMeeting");
        }
    }
}

