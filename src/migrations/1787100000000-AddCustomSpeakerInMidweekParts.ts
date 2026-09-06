import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCustomSpeakerInMidweekParts1787100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("midweek_meeting_parts", "custom_speaker_name");
        if (!hasColumn) {
            await queryRunner.addColumn(
                "midweek_meeting_parts",
                new TableColumn({
                    name: "custom_speaker_name",
                    type: "varchar",
                    isNullable: true
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("midweek_meeting_parts", "custom_speaker_name");
        if (hasColumn) {
            await queryRunner.dropColumn("midweek_meeting_parts", "custom_speaker_name");
        }
    }
}
