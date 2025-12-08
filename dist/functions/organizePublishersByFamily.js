"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizePublishersByFamily = void 0;
function organizePublishersByFamily(publishers) {
    var _a;
    const familyMap = new Map();
    const singles = [];
    publishers.forEach(pub => {
        if (pub.family) {
            const familyId = pub.family.id;
            if (!familyMap.has(familyId)) {
                familyMap.set(familyId, {
                    ...pub.family,
                    members: []
                });
            }
            familyMap.get(familyId).members.push(pub);
        }
        else {
            singles.push(pub);
        }
    });
    const orderedFamilies = [...familyMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    const orderedList = [];
    const addedIds = new Set();
    for (const family of orderedFamilies) {
        const responsibleId = (_a = family.responsible) === null || _a === void 0 ? void 0 : _a.id;
        // Responsável primeiro
        if (responsibleId && !addedIds.has(responsibleId)) {
            orderedList.push({
                id: family.responsible.id,
                fullName: family.responsible.fullName,
                nickname: family.responsible.nickname
            });
            addedIds.add(responsibleId);
        }
        // Depois os demais membros
        family.members
            .filter(m => !addedIds.has(m.id))
            .sort((a, b) => a.fullName.localeCompare(b.fullName))
            .forEach(m => {
            orderedList.push({
                id: m.id,
                fullName: m.fullName,
                nickname: m.nickname
            });
            addedIds.add(m.id);
        });
    }
    // Publicadores sem família no final
    singles
        .filter(s => !addedIds.has(s.id))
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .forEach(s => {
        orderedList.push({
            id: s.id,
            fullName: s.fullName,
            nickname: s.nickname
        });
        addedIds.add(s.id);
    });
    return orderedList;
}
exports.organizePublishersByFamily = organizePublishersByFamily;
