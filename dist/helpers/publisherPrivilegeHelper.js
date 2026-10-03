"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivePrivilegeNamesPT = exports.getActivePrivilegeCodes = exports.getActivePrivileges = exports.hasAnyPrivilege = exports.hasPrivilege = exports.isPrivilegeActiveAt = void 0;
const privileges_1 = require("../types/privileges");
/**
 * Checks if a PublisherPrivilege record is active at a given date.
 * If targetDate is omitted, current date is used.
 */
function isPrivilegeActiveAt(pp, targetDate = new Date()) {
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    if (pp.startDate) {
        const start = new Date(pp.startDate);
        start.setHours(0, 0, 0, 0);
        if (target < start)
            return false;
    }
    if (pp.endDate) {
        const end = new Date(pp.endDate);
        end.setHours(23, 59, 59, 999);
        if (target > end)
            return false;
    }
    return true;
}
exports.isPrivilegeActiveAt = isPrivilegeActiveAt;
/**
 * Maps a PrivilegeCode to equivalent English and Portuguese names for resilient fallback.
 */
const codeToNamesMap = {
    [privileges_1.PrivilegeCode.PUBLISHER]: { en: "Publisher", pt: "Publicador" },
    [privileges_1.PrivilegeCode.ELDER]: { en: "Elder", pt: "Ancião" },
    [privileges_1.PrivilegeCode.MINISTERIAL_SERVANT]: { en: "Ministerial Servant", pt: "Servo Ministerial" },
    [privileges_1.PrivilegeCode.REGULAR_PIONEER]: { en: "Regular Pioneer", pt: "Pioneiro Regular" },
    [privileges_1.PrivilegeCode.SPECIAL_PIONEER]: { en: "Special Pioneer", pt: "Pioneiro Especial" },
    [privileges_1.PrivilegeCode.MISSIONARY_WORLDWIDE]: { en: "Missionary Worldwide", pt: "Missionário em Campo" },
    [privileges_1.PrivilegeCode.CONTINUOUS_AUXILIARY_PIONEER]: { en: "Continuous Auxiliary Pioneer", pt: "Auxiliar por Tempo Indeterminado" },
    [privileges_1.PrivilegeCode.AUXILIARY_PIONEER]: { en: "Auxiliary Pioneer", pt: "Pioneiro Auxiliar" },
    [privileges_1.PrivilegeCode.SPEAKER]: { en: "Speaker", pt: "Orador" },
    [privileges_1.PrivilegeCode.READER]: { en: "Reader", pt: "Leitor" },
    [privileges_1.PrivilegeCode.CHAIRMAN]: { en: "Chairman", pt: "Presidente" },
    [privileges_1.PrivilegeCode.ATTENDANT]: { en: "Attendant", pt: "Indicador" },
    [privileges_1.PrivilegeCode.MICROPHONE_ATTENDANT]: { en: "Microphone Attendant", pt: "Microfone Volante" },
    [privileges_1.PrivilegeCode.FIELD_CONDUCTOR]: { en: "Field Conductor", pt: "Dirigente de Campo" },
    [privileges_1.PrivilegeCode.PUBLIC_WITNESS]: { en: "Public Witness", pt: "Testemunho Público" },
    [privileges_1.PrivilegeCode.SOUND]: { en: "Sound", pt: "Som" },
    [privileges_1.PrivilegeCode.MEDIA]: { en: "Media", pt: "Mídias" },
    [privileges_1.PrivilegeCode.SOUND_AND_MEDIA]: { en: "Sound and Media", pt: "Som e Mídias" },
    [privileges_1.PrivilegeCode.STAGE_ATTENDANT]: { en: "Stage Attendant", pt: "Pedestal" }
};
/**
 * Returns true if the publisher has the specified privilege active at the target date.
 */
function hasPrivilege(publisher, code, targetDate = new Date()) {
    if (!publisher)
        return false;
    // Primary check: relational entity with active dates
    if (publisher.privilegesRelation && Array.isArray(publisher.privilegesRelation) && publisher.privilegesRelation.length > 0) {
        const matchingRecords = publisher.privilegesRelation.filter(pp => {
            if (!pp.privilege)
                return false;
            const matchCode = pp.privilege.code === code;
            const names = codeToNamesMap[code];
            const matchName = names && (pp.privilege.name === names.en || pp.privilege.name === names.pt);
            return matchCode || matchName;
        });
        if (matchingRecords.length > 0) {
            return matchingRecords.some(pp => isPrivilegeActiveAt(pp, targetDate));
        }
    }
    // Fallback: check publisher.privileges string array
    if (publisher.privileges && Array.isArray(publisher.privileges)) {
        const names = codeToNamesMap[code];
        return publisher.privileges.some(p => p === code ||
            (names && (p === names.en || p === names.pt)));
    }
    return false;
}
exports.hasPrivilege = hasPrivilege;
/**
 * Checks if publisher has ANY of the specified privilege codes active.
 */
function hasAnyPrivilege(publisher, codes, targetDate = new Date()) {
    return codes.some(code => hasPrivilege(publisher, code, targetDate));
}
exports.hasAnyPrivilege = hasAnyPrivilege;
/**
 * Returns list of PublisherPrivilege records active at target date.
 */
function getActivePrivileges(publisher, targetDate = new Date()) {
    if (!(publisher === null || publisher === void 0 ? void 0 : publisher.privilegesRelation) || !Array.isArray(publisher.privilegesRelation)) {
        return [];
    }
    return publisher.privilegesRelation.filter(pp => isPrivilegeActiveAt(pp, targetDate));
}
exports.getActivePrivileges = getActivePrivileges;
/**
 * Returns list of active PrivilegeCodes for the publisher at target date.
 */
function getActivePrivilegeCodes(publisher, targetDate = new Date()) {
    var _a;
    const activePP = getActivePrivileges(publisher, targetDate);
    const codes = [];
    for (const pp of activePP) {
        if (((_a = pp.privilege) === null || _a === void 0 ? void 0 : _a.code) && Object.values(privileges_1.PrivilegeCode).includes(pp.privilege.code)) {
            codes.push(pp.privilege.code);
        }
    }
    return Array.from(new Set(codes));
}
exports.getActivePrivilegeCodes = getActivePrivilegeCodes;
/**
 * Returns active privilege names in Portuguese for snapshotting in reports.
 */
function getActivePrivilegeNamesPT(publisher, targetDate = new Date()) {
    const activePP = getActivePrivileges(publisher, targetDate);
    const names = [];
    for (const pp of activePP) {
        if (pp.privilege) {
            const code = pp.privilege.code;
            const mapped = code && codeToNamesMap[code];
            if (mapped) {
                names.push(mapped.pt);
            }
            else if (pp.privilege.name) {
                names.push(pp.privilege.name);
            }
        }
    }
    return Array.from(new Set(names));
}
exports.getActivePrivilegeNamesPT = getActivePrivilegeNamesPT;
