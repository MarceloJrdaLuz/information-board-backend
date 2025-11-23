"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeTimestampToDateinPublisher1763882151497 = void 0;
class ChangeTimestampToDateinPublisher1763882151497 {
    constructor() {
        this.name = 'ChangeTimestampToDateinPublisher1763882151497';
    }
    async up(queryRunner) {
        // dateImmersed
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "dateImmersed"
      TYPE DATE
      USING ("dateImmersed" AT TIME ZONE 'America/Sao_Paulo')::date;
    `);
        // birthDate
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "birthDate"
      TYPE DATE
      USING ("birthDate" AT TIME ZONE 'America/Sao_Paulo')::date;
    `);
        // startPioneer
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "startPioneer"
      TYPE DATE
      USING ("startPioneer" AT TIME ZONE 'America/Sao_Paulo')::date;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "dateImmersed"
      TYPE TIMESTAMP;
    `);
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "birthDate"
      TYPE TIMESTAMP;
    `);
        await queryRunner.query(`
      ALTER TABLE publishers
      ALTER COLUMN "startPioneer"
      TYPE TIMESTAMP;
    `);
    }
}
exports.ChangeTimestampToDateinPublisher1763882151497 = ChangeTimestampToDateinPublisher1763882151497;
