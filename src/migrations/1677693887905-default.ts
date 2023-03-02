import { MigrationInterface, QueryRunner } from "typeorm";

export class default1677693887905 implements MigrationInterface {
    name = 'default1677693887905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" ADD "congregation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "publishers" ADD CONSTRAINT "FK_022658ed9d063307aab18f993a4" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "publishers" DROP CONSTRAINT "FK_022658ed9d063307aab18f993a4"`);
        await queryRunner.query(`ALTER TABLE "publishers" DROP COLUMN "congregation_id"`);
    }

}
