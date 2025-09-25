"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePrivilegesAndPublisherPrivileges1757259899995 = void 0;
class CreatePrivilegesAndPublisherPrivileges1757259899995 {
    constructor() {
        this.name = 'CreatePrivilegesAndPublisherPrivileges1757259899995';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "privileges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_913e0b87d35069ac7bd7982d889" UNIQUE ("name"), CONSTRAINT "PK_13f3ff98ae4d5565ec5ed6036cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "publisher_privileges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "publisherId" uuid, "privilegeId" uuid, CONSTRAINT "PK_2b46b6fe2932365b08af2e819cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "publisher_privileges" ADD CONSTRAINT "FK_6494b2daddff1321cdb50e7a783" FOREIGN KEY ("publisherId") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "publisher_privileges" ADD CONSTRAINT "FK_e11746b0bcfc32c2e60f9e98dea" FOREIGN KEY ("privilegeId") REFERENCES "privileges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "publisher_privileges" DROP CONSTRAINT "FK_e11746b0bcfc32c2e60f9e98dea"`);
        await queryRunner.query(`ALTER TABLE "publisher_privileges" DROP CONSTRAINT "FK_6494b2daddff1321cdb50e7a783"`);
        await queryRunner.query(`DROP TABLE "publisher_privileges"`);
        await queryRunner.query(`DROP TABLE "privileges"`);
    }
}
exports.CreatePrivilegesAndPublisherPrivileges1757259899995 = CreatePrivilegesAndPublisherPrivileges1757259899995;
