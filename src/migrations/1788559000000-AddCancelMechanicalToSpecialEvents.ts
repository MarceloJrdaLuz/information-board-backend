import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCancelMechanicalToSpecialEvents1788559000000 implements MigrationInterface {
    name = "AddCancelMechanicalToSpecialEvents1788559000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("special_events", "cancelMechanical");
        if (!hasColumn) {
            await queryRunner.addColumn(
                "special_events",
                new TableColumn({
                    name: "cancelMechanical",
                    type: "boolean",
                    default: false
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("special_events", "cancelMechanical");
        if (hasColumn) {
            await queryRunner.dropColumn("special_events", "cancelMechanical");
        }
    }
}
