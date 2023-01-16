import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673881252755 implements MigrationInterface {
    name = 'default1673881252755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_d883ed317f0dc1c1ce32fa1745d"`);
        await queryRunner.query(`CREATE TABLE "profile" ("id" SERIAL NOT NULL, "name" text NOT NULL, "lastName" text NOT NULL, "congregationId" integer, "userId" integer, CONSTRAINT "REL_a24972ebd73b106250713dcddd" UNIQUE ("userId"), CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_a24972ebd73b106250713dcddd9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_a24972ebd73b106250713dcddd9"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "congregationId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" text NOT NULL`);
        await queryRunner.query(`DROP TABLE "profile"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_d883ed317f0dc1c1ce32fa1745d" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
