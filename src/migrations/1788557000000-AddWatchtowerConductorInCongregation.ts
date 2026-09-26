import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWatchtowerConductorInCongregation1788557000000 implements MigrationInterface {
    name = 'AddWatchtowerConductorInCongregation1788557000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" ADD "watchtower_conductor_id" uuid`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "FK_congregation_watchtower_conductor" FOREIGN KEY ("watchtower_conductor_id") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "FK_congregation_watchtower_conductor"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "watchtower_conductor_id"`);
    }
}
