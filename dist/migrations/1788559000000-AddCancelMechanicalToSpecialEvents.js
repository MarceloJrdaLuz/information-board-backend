"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCancelMechanicalToSpecialEvents1788559000000 = void 0;
const typeorm_1 = require("typeorm");
class AddCancelMechanicalToSpecialEvents1788559000000 {
    constructor() {
        this.name = "AddCancelMechanicalToSpecialEvents1788559000000";
    }
    async up(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("special_events", "cancelMechanical");
        if (!hasColumn) {
            await queryRunner.addColumn("special_events", new typeorm_1.TableColumn({
                name: "cancelMechanical",
                type: "boolean",
                default: false
            }));
        }
    }
    async down(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("special_events", "cancelMechanical");
        if (hasColumn) {
            await queryRunner.dropColumn("special_events", "cancelMechanical");
        }
    }
}
exports.AddCancelMechanicalToSpecialEvents1788559000000 = AddCancelMechanicalToSpecialEvents1788559000000;
