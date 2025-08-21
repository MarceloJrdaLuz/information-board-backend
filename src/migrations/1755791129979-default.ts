import { MigrationInterface, QueryRunner } from "typeorm";

export class default1755791129979 implements MigrationInterface {
    name = 'default1755791129979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ADD "emergencyContactId" uuid`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_c40b64b5864b8fa7508697c7e4c" FOREIGN KEY ("emergencyContactId") REFERENCES "emergency_contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_c40b64b5864b8fa7508697c7e4c"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "emergencyContactId"`);
    }

}
