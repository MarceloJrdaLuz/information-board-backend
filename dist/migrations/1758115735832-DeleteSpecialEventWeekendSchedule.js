"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropSpecialWeekendEvents1758115735832 = void 0;
class DropSpecialWeekendEvents1758115735832 {
    constructor() {
        this.name = 'DropSpecialWeekendEvents1758115735832';
    }
    async up(queryRunner) {
        // Dropa a tabela se existir, sem se preocupar com FKs externas
        await queryRunner.query(`DROP TABLE IF EXISTS "special_weekend_events"`);
    }
    async down(queryRunner) {
        // Recria a tabela com todos os campos
        await queryRunner.query(`
            CREATE TABLE "special_weekend_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "date" date NOT NULL,
                "name" text NOT NULL,
                "speaker" text,
                "chairman_id" uuid,
                "hospitality_group_id" uuid,
                "congregation_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);
        // Adiciona FKs
        await queryRunner.query(`
            ALTER TABLE "special_weekend_events"
            ADD CONSTRAINT "FK_special_weekend_events_chairman" 
            FOREIGN KEY ("chairman_id") REFERENCES "publisher"("id") ON DELETE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "special_weekend_events"
            ADD CONSTRAINT "FK_special_weekend_events_hospitality_group" 
            FOREIGN KEY ("hospitality_group_id") REFERENCES "hospitality_group"("id") ON DELETE SET NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "special_weekend_events"
            ADD CONSTRAINT "FK_special_weekend_events_congregation" 
            FOREIGN KEY ("congregation_id") REFERENCES "congregation"("id") ON DELETE CASCADE
        `);
    }
}
exports.DropSpecialWeekendEvents1758115735832 = DropSpecialWeekendEvents1758115735832;
