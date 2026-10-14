"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnsurePublisherPrivilegeForAllPublishers1788562000000 = void 0;
const Publisher_1 = require("../entities/Publisher");
const Privilege_1 = require("../entities/Privilege");
const PublisherPrivilege_1 = require("../entities/PublisherPrivilege");
class EnsurePublisherPrivilegeForAllPublishers1788562000000 {
    constructor() {
        this.name = "EnsurePublisherPrivilegeForAllPublishers1788562000000";
    }
    async up(queryRunner) {
        const publisherRepo = queryRunner.manager.getRepository(Publisher_1.Publisher);
        const privilegeRepo = queryRunner.manager.getRepository(Privilege_1.Privilege);
        const publisherPrivilegeRepo = queryRunner.manager.getRepository(PublisherPrivilege_1.PublisherPrivilege);
        // 1. Locate or ensure the PUBLISHER privilege exists
        let publisherPriv = await privilegeRepo.findOne({
            where: [
                { code: "PUBLISHER" },
                { name: "Publisher" },
                { name: "Publicador" }
            ]
        });
        if (!publisherPriv) {
            publisherPriv = await privilegeRepo.save({
                code: "PUBLISHER",
                name: "Publisher"
            });
        }
        // 2. Load all existing publishers
        const publishers = await publisherRepo.find();
        // 3. For each publisher, ensure they have the PUBLISHER privilege recorded
        for (const publisher of publishers) {
            const existing = await publisherPrivilegeRepo.findOne({
                where: {
                    publisher: { id: publisher.id },
                    privilege: { id: publisherPriv.id },
                    endDate: null
                }
            });
            if (!existing) {
                await publisherPrivilegeRepo.save({
                    publisher,
                    privilege: publisherPriv,
                    startDate: null,
                    endDate: null
                });
            }
        }
    }
    async down(queryRunner) {
    }
}
exports.EnsurePublisherPrivilegeForAllPublishers1788562000000 = EnsurePublisherPrivilegeForAllPublishers1788562000000;
