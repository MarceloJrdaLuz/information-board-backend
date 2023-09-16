import { MigrationInterface, QueryRunner } from "typeorm";

export class default1694456723380 implements MigrationInterface {
    name = 'default1694456723380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" ADD "expired" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6"`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "congregation_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6"`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "congregation_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "expired"`);
    }

}
