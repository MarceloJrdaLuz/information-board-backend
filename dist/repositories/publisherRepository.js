"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPublisherWithPrivilege = exports.publisherRepository = void 0;
const data_source_1 = require("../data-source");
const Publisher_1 = require("../entities/Publisher");
exports.publisherRepository = data_source_1.AppDataSource.getRepository(Publisher_1.Publisher);
async function findPublisherWithPrivilege(id, privilege) {
    var _a;
    const publisher = await exports.publisherRepository.findOne({
        where: { id },
        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
    });
    if (!publisher)
        return null;
    const hasPrivilege = (_a = publisher.privilegesRelation) === null || _a === void 0 ? void 0 : _a.some(pp => pp.privilege.name === privilege);
    return hasPrivilege ? publisher : null;
}
exports.findPublisherWithPrivilege = findPublisherWithPrivilege;
