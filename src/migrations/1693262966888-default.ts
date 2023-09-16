import { MigrationInterface, QueryRunner } from "typeorm";

export class default1693262966888 implements MigrationInterface {
    name = 'default1693262966888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "consent-record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" text NOT NULL, "ip" text NOT NULL, "consentDate" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c4af1c65d56f6c6070c2293f27" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "consent-record"`);
    }

}
