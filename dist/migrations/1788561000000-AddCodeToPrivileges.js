"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCodeToPrivileges1788561000000 = void 0;
class AddCodeToPrivileges1788561000000 {
    constructor() {
        this.name = "AddCodeToPrivileges1788561000000";
    }
    async up(queryRunner) {
        // 1. Add nullable code column
        await queryRunner.query(`
            ALTER TABLE privileges ADD COLUMN IF NOT EXISTS code VARCHAR(100);
        `);
        // 2. Populate code for all existing standard privileges
        await queryRunner.query(`
            UPDATE privileges SET code = 'PUBLISHER' WHERE name IN ('Publisher', 'Publicador');
            UPDATE privileges SET code = 'ELDER' WHERE name IN ('Elder', 'Ancião', 'Anciao');
            UPDATE privileges SET code = 'MINISTERIAL_SERVANT' WHERE name IN ('Ministerial Servant', 'Servo Ministerial');
            UPDATE privileges SET code = 'REGULAR_PIONEER' WHERE name IN ('Regular Pioneer', 'Pioneiro Regular');
            UPDATE privileges SET code = 'SPECIAL_PIONEER' WHERE name IN ('Special Pioneer', 'Pioneiro Especial');
            UPDATE privileges SET code = 'MISSIONARY_WORLDWIDE' WHERE name IN ('Missionary Worldwide', 'Missionário em Campo', 'Missionario em Campo', 'Missionário', 'Missionario');
            UPDATE privileges SET code = 'CONTINUOUS_AUXILIARY_PIONEER' WHERE name IN ('Continuous Auxiliary Pioneer', 'Auxiliar por Tempo Indeterminado', 'Auxiliar Indeterminado');
            UPDATE privileges SET code = 'AUXILIARY_PIONEER' WHERE name IN ('Auxiliary Pioneer', 'Pioneiro Auxiliar');
            UPDATE privileges SET code = 'SPEAKER' WHERE name IN ('Speaker', 'Orador');
            UPDATE privileges SET code = 'READER' WHERE name IN ('Reader', 'Leitor');
            UPDATE privileges SET code = 'CHAIRMAN' WHERE name IN ('Chairman', 'Presidente');
            UPDATE privileges SET code = 'ATTENDANT' WHERE name IN ('Attendant', 'Indicador');
            UPDATE privileges SET code = 'MICROPHONE_ATTENDANT' WHERE name IN ('Microphone Attendant', 'Microfone Volante');
            UPDATE privileges SET code = 'FIELD_CONDUCTOR' WHERE name IN ('Field Conductor', 'Dirigente de Campo');
            UPDATE privileges SET code = 'PUBLIC_WITNESS' WHERE name IN ('Public Witness', 'Testemunho Público', 'Testemunho Publico');
            UPDATE privileges SET code = 'SOUND' WHERE name IN ('Sound', 'Som');
            UPDATE privileges SET code = 'MEDIA' WHERE name IN ('Media', 'Mídias', 'Midias');
            UPDATE privileges SET code = 'SOUND_AND_MEDIA' WHERE name IN ('Sound and Media', 'Som e Mídias', 'Som e Midias');
            UPDATE privileges SET code = 'STAGE_ATTENDANT' WHERE name IN ('Stage Attendant', 'Stage', 'Pedestal');
        `);
        // 3. Fallback for any other custom privilege names
        await queryRunner.query(`
            UPDATE privileges 
            SET code = UPPER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '_', 'g'))
            WHERE code IS NULL;
        `);
        // 4. Make code NOT NULL and UNIQUE
        await queryRunner.query(`
            ALTER TABLE privileges ALTER COLUMN code SET NOT NULL;
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_privileges_code" ON privileges (code);
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_privileges_code";
        `);
        await queryRunner.query(`
            ALTER TABLE privileges DROP COLUMN IF EXISTS code;
        `);
    }
}
exports.AddCodeToPrivileges1788561000000 = AddCodeToPrivileges1788561000000;
