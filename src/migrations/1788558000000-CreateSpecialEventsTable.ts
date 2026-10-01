import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSpecialEventsTable1788558000000 implements MigrationInterface {
    name = "CreateSpecialEventsTable1788558000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enums para tipo e escopo de impacto do evento
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'special_events_type_enum') THEN
                    CREATE TYPE "public"."special_events_type_enum" AS ENUM(
                        'CIRCUIT_ASSEMBLY',
                        'REGIONAL_CONVENTION',
                        'MEMORIAL',
                        'CIRCUIT_OVERSEER_VISIT',
                        'SPECIAL_TALK',
                        'CUSTOM'
                    );
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'special_events_impact_scope_enum') THEN
                    CREATE TYPE "public"."special_events_impact_scope_enum" AS ENUM(
                        'NONE',
                        'EVENT_DAYS_ONLY',
                        'ALL_DAYS'
                    );
                END IF;
            END $$;
        `);

        // Tabela central de Eventos Especiais
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "special_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "congregation_id" uuid NOT NULL,
                "type" "public"."special_events_type_enum" NOT NULL DEFAULT 'CUSTOM',
                "title" text NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date NOT NULL,
                "affectsWholeWeek" boolean NOT NULL DEFAULT true,
                "cancelMidweekMeeting" boolean NOT NULL DEFAULT false,
                "cancelWeekendMeeting" boolean NOT NULL DEFAULT false,
                "isCircuitOverseerVisit" boolean NOT NULL DEFAULT false,
                "cancelCleaning" boolean NOT NULL DEFAULT false,
                "fieldServiceImpact" "public"."special_events_impact_scope_enum" NOT NULL DEFAULT 'NONE',
                "publicWitnessingImpact" "public"."special_events_impact_scope_enum" NOT NULL DEFAULT 'NONE',
                "showOnPublicBoard" boolean NOT NULL DEFAULT true,
                "theme" text,
                "location" text,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_special_events_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_special_events_congregation" FOREIGN KEY ("congregation_id")
                    REFERENCES "congregation"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "special_events"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."special_events_impact_scope_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."special_events_type_enum"`);
    }
}
