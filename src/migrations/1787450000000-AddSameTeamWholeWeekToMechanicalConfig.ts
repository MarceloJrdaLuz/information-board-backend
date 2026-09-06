import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSameTeamWholeWeekToMechanicalConfig1787450000000 implements MigrationInterface {
    name = "AddSameTeamWholeWeekToMechanicalConfig1787450000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("mechanical_schedule_config", "sameTeamWholeWeek");
        if (!hasColumn) {
            await queryRunner.addColumn(
                "mechanical_schedule_config",
                new TableColumn({
                    name: "sameTeamWholeWeek",
                    type: "boolean",
                    default: false
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("mechanical_schedule_config", "sameTeamWholeWeek");
        if (hasColumn) {
            await queryRunner.dropColumn("mechanical_schedule_config", "sameTeamWholeWeek");
        }
    }
}

