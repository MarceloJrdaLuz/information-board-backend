import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673900280145 implements MigrationInterface {
    name = 'default1673900280145'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_a24972ebd73b106250713dcddd9"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "congregationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_a24972ebd73b106250713dcddd9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_a24972ebd73b106250713dcddd9"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "congregationId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_a24972ebd73b106250713dcddd9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
