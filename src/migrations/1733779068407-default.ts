import { MigrationInterface, QueryRunner } from "typeorm";

export class default1733779068407 implements MigrationInterface {
    name = 'default1733779068407'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "territory_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "caretaker" character varying NOT NULL, "assignment_date" date NOT NULL, "completion_date" date, "territoryId" uuid, CONSTRAINT "PK_54c6f7aa943580326986650191c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "territory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "image_url" text NOT NULL, "description" text, "key" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "congregation_id" uuid, CONSTRAINT "PK_2250448f958bc52a8d040b48f82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "territory_history" ADD CONSTRAINT "FK_24ccd79bcf489cbd710c07b1758" FOREIGN KEY ("territoryId") REFERENCES "territory"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "territory" ADD CONSTRAINT "FK_0ae1c25b243ea2633d85196d651" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "territory" DROP CONSTRAINT "FK_0ae1c25b243ea2633d85196d651"`);
        await queryRunner.query(`ALTER TABLE "territory_history" DROP CONSTRAINT "FK_24ccd79bcf489cbd710c07b1758"`);
        await queryRunner.query(`DROP TABLE "territory"`);
        await queryRunner.query(`DROP TABLE "territory_history"`);
    }

}
