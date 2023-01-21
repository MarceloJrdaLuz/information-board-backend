import { MigrationInterface, QueryRunner } from "typeorm";

export class default1674229232883 implements MigrationInterface {
    name = 'default1674229232883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "congregationId" uuid NOT NULL, CONSTRAINT "PK_3eb18c29da25d6935fcbe584237" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_d072d6e5e48220ba2a74bd76379" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_d072d6e5e48220ba2a74bd76379"`);
        await queryRunner.query(`DROP TABLE "notices"`);
    }

}
