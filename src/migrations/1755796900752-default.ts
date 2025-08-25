import { MigrationInterface, QueryRunner } from "typeorm";

export class default1755796900752 implements MigrationInterface {
    name = 'default1755796900752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "emergency_contacts" ADD "congregationId" uuid`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" ADD CONSTRAINT "FK_15b8cdbf66d3bd08cdc6bdbeade" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "emergency_contacts" DROP CONSTRAINT "FK_15b8cdbf66d3bd08cdc6bdbeade"`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" DROP COLUMN "congregationId"`);
    }

}
