import { MigrationInterface, QueryRunner } from "typeorm";

export class default1674144400659 implements MigrationInterface {
    name = 'default1674144400659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "congregationId" uuid`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "congregationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "PK_17b5bb706b1fdb7a991476630fe"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "PK_17b5bb706b1fdb7a991476630fe" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP CONSTRAINT "PK_17b5bb706b1fdb7a991476630fe"`);
        await queryRunner.query(`ALTER TABLE "congregation" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ADD CONSTRAINT "PK_17b5bb706b1fdb7a991476630fe" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "congregationId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "congregationId" integer`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
