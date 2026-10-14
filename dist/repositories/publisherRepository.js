"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPublisherWithPrivilege = exports.publisherRepository = void 0;
const data_source_1 = require("../data-source");
const Publisher_1 = require("../entities/Publisher");
const privileges_1 = require("../types/privileges");
const publisherPrivilegeHelper_1 = require("../helpers/publisherPrivilegeHelper");
exports.publisherRepository = data_source_1.AppDataSource.getRepository(Publisher_1.Publisher);
async function findPublisherWithPrivilege(id, privilege) {
    var _a;
    const publisher = await exports.publisherRepository.findOne({
        where: { id },
        relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
    });
    if (!publisher)
        return null;
    if (Object.values(privileges_1.PrivilegeCode).includes(privilege)) {
        const isGranted = (0, publisherPrivilegeHelper_1.hasPrivilege)(publisher, privilege);
        return isGranted ? publisher : null;
    }
    const hasRel = (_a = publisher.privilegesRelation) === null || _a === void 0 ? void 0 : _a.some(pp => { var _a, _b; return ((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.name) === privilege || ((_b = pp.privilege) === null || _b === void 0 ? void 0 : _b.code) === privilege; });
    return hasRel ? publisher : null;
}
exports.findPublisherWithPrivilege = findPublisherWithPrivilege;
