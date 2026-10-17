import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasskeyTables1788573000000 implements MigrationInterface {
    name = "CreatePasskeyTables1788573000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Tabela passkey_credentials (armazena as credenciais públicas dos dispositivos dos usuários)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "passkey_credentials" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "credential_id" text NOT NULL,
                "public_key" text NOT NULL,
                "counter" bigint NOT NULL DEFAULT 0,
                "device_type" varchar(32) NOT NULL DEFAULT 'singleDevice',
                "backed_up" boolean NOT NULL DEFAULT false,
                "transports" text,
                "nickname" varchar(120) NOT NULL DEFAULT 'Chave de Acesso',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "last_used_at" TIMESTAMP,
                CONSTRAINT "PK_passkey_credentials" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_passkey_credential_id" UNIQUE ("credential_id"),
                CONSTRAINT "FK_passkey_credentials_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_passkey_credentials_user_id" ON "passkey_credentials" ("user_id");
        `);

        // 2. Enum e tabela passkey_challenges (armazena os desafios criptográficos temporários)
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."passkey_challenges_type_enum" AS ENUM('REGISTRATION', 'AUTHENTICATION');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "passkey_challenges" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "challenge" text NOT NULL,
                "user_id" uuid,
                "email" varchar(255),
                "type" "public"."passkey_challenges_type_enum" NOT NULL DEFAULT 'AUTHENTICATION',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_passkey_challenges" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_passkey_challenges_challenge" ON "passkey_challenges" ("challenge");
            CREATE INDEX IF NOT EXISTS "IDX_passkey_challenges_expires_at" ON "passkey_challenges" ("expires_at");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "passkey_challenges"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."passkey_challenges_type_enum"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "passkey_credentials"`);
    }
}

