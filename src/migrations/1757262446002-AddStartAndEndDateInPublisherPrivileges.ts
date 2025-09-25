import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStartAndEndDateInPublisherPrivileges1757262446002 implements MigrationInterface {
    name = 'AddStartAndEndDateInPublisherPrivileges1757262446002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publisher_privileges" ADD "startDate" date`);
        await queryRunner.query(`ALTER TABLE "publisher_privileges" ADD "endDate" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publisher_privileges" DROP COLUMN "endDate"`);
        await queryRunner.query(`ALTER TABLE "publisher_privileges" DROP COLUMN "startDate"`);
    }

}
