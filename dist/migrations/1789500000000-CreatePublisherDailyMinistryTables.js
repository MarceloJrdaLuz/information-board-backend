"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePublisherDailyMinistryTables1789500000000 = void 0;
class CreatePublisherDailyMinistryTables1789500000000 {
    constructor() {
        this.name = "CreatePublisherDailyMinistryTables1789500000000";
    }
    async up(queryRunner) {
        // 1. Tabela de Estudantes Bíblicos
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "publisher_bible_students" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "publisher_id" uuid NOT NULL,
                "name" text NOT NULL,
                "active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_publisher_bible_students" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "publisher_bible_students"
            ADD CONSTRAINT "FK_pbs_publisher" FOREIGN KEY ("publisher_id")
            REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        // 2. Tabela de Atividades Diárias
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "publisher_field_activities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "publisher_id" uuid NOT NULL,
                "date" date NOT NULL,
                "minutes" integer NOT NULL DEFAULT 0,
                "credit_minutes" integer NOT NULL DEFAULT 0,
                "credit_description" text,
                "notes" text,
                "bible_student_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_publisher_field_activities" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "publisher_field_activities"
            ADD CONSTRAINT "FK_pfa_publisher" FOREIGN KEY ("publisher_id")
            REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "publisher_field_activities"
            ADD CONSTRAINT "FK_pfa_bible_student" FOREIGN KEY ("bible_student_id")
            REFERENCES "publisher_bible_students"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        // 3. Tabela de Saldo Mensal / Minutos
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "publisher_month_balances" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "publisher_id" uuid NOT NULL,
                "month" text NOT NULL,
                "year" text NOT NULL,
                "transferred_minutes_in" integer NOT NULL DEFAULT 0,
                "transferred_minutes_out" integer NOT NULL DEFAULT 0,
                "is_closed" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_pmb_publisher_month_year" UNIQUE ("publisher_id", "month", "year"),
                CONSTRAINT "PK_publisher_month_balances" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "publisher_month_balances"
            ADD CONSTRAINT "FK_pmb_publisher" FOREIGN KEY ("publisher_id")
            REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_month_balances" DROP CONSTRAINT "FK_pmb_publisher"`);
        await queryRunner.query(`DROP TABLE "publisher_month_balances"`);
        await queryRunner.query(`ALTER TABLE "publisher_field_activities" DROP CONSTRAINT "FK_pfa_bible_student"`);
        await queryRunner.query(`ALTER TABLE "publisher_field_activities" DROP CONSTRAINT "FK_pfa_publisher"`);
        await queryRunner.query(`DROP TABLE "publisher_field_activities"`);
        await queryRunner.query(`ALTER TABLE "publisher_bible_students" DROP CONSTRAINT "FK_pbs_publisher"`);
        await queryRunner.query(`DROP TABLE "publisher_bible_students"`);
    }
}
exports.CreatePublisherDailyMinistryTables1789500000000 = CreatePublisherDailyMinistryTables1789500000000;
