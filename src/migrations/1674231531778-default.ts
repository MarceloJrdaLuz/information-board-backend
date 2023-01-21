import { MigrationInterface, QueryRunner } from "typeorm";

export class default1674231531778 implements MigrationInterface {
    name = 'default1674231531778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_08d446698bb533bd2c7f5c14330"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_a24972ebd73b106250713dcddd9"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "UQ_a24972ebd73b106250713dcddd9"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "congregationId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "category_id" uuid`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "congregation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "congregation_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "UQ_d752442f45f258a8bdefeebb2f2" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_b89e90c19762165e9647686650e" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_270ec4d83ed0462d27d9e881434" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_1c44a2e90934dcd7d9b6e1365fd" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_1c44a2e90934dcd7d9b6e1365fd"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_270ec4d83ed0462d27d9e881434"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_b89e90c19762165e9647686650e"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "UQ_d752442f45f258a8bdefeebb2f2"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "congregation_id"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "congregation_id"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "category_id"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "congregationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "UQ_a24972ebd73b106250713dcddd9" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "congregationId" uuid`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "categoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_a24972ebd73b106250713dcddd9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_08d446698bb533bd2c7f5c14330" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_d1cad809d29faad0ff16f81bbc7" FOREIGN KEY ("congregationId") REFERENCES "congregation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_2d7e06f29424dbb29a827a7c1b5" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
