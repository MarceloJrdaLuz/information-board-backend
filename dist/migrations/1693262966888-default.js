"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1693262966888 = void 0;
class default1693262966888 {
    constructor() {
        this.name = 'default1693262966888';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "consent-record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" text NOT NULL, "ip" text NOT NULL, "consentDate" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c4af1c65d56f6c6070c2293f27" PRIMARY KEY ("id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "consent-record"`);
    }
}
exports.default1693262966888 = default1693262966888;
