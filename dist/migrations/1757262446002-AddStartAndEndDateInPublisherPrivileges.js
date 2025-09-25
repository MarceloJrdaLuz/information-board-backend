"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddStartAndEndDateInPublisherPrivileges1757262446002 = void 0;
class AddStartAndEndDateInPublisherPrivileges1757262446002 {
    constructor() {
        this.name = 'AddStartAndEndDateInPublisherPrivileges1757262446002';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_privileges" ADD "startDate" date`);
        await queryRunner.query(`ALTER TABLE "publisher_privileges" ADD "endDate" date`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_privileges" DROP COLUMN "endDate"`);
        await queryRunner.query(`ALTER TABLE "publisher_privileges" DROP COLUMN "startDate"`);
    }
}
exports.AddStartAndEndDateInPublisherPrivileges1757262446002 = AddStartAndEndDateInPublisherPrivileges1757262446002;
