import { MigrationInterface, QueryRunner } from "typeorm";

export class default1674229484011 implements MigrationInterface {
    name = 'default1674229484011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_d072d6e5e48220ba2a74bd76379"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "notices" RENAME COLUMN "congregationId" TO "congregation_id"`);
        await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_e052a8b94a99d8d1371af92b8c6"`);
        await queryRunner.query(`ALTER TABLE "notices" RENAME COLUMN "congregation_id" TO "congregationId"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_d072d6e5e48220ba2a74bd76379" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
