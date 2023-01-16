import { MigrationInterface, QueryRunner } from "typeorm";

export class default1673875633308 implements MigrationInterface {
    name = 'default1673875633308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "congregation" ("id" SERIAL NOT NULL, "name" text NOT NULL, "number" text NOT NULL, CONSTRAINT "PK_17b5bb706b1fdb7a991476630fe" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "congregation"`);
    }

}
