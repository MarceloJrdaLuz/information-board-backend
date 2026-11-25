import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSpeakerShareTokens1789540000000 implements MigrationInterface {
    name = "CreateSpeakerShareTokens1789540000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "speaker_share_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token" text NOT NULL,
                "congregation_id" uuid NOT NULL,
                "user_id" uuid,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_speaker_share_tokens" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_speaker_share_tokens_token" UNIQUE ("token"),
                CONSTRAINT "FK_speaker_share_tokens_congregation" FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_speaker_share_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_speaker_share_tokens_token" ON "speaker_share_tokens" ("token");
            CREATE INDEX IF NOT EXISTS "IDX_speaker_share_tokens_congregation" ON "speaker_share_tokens" ("congregation_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "speaker_share_tokens";`);
    }
}
