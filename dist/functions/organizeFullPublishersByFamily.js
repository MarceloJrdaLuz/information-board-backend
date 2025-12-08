"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizeFullPublishersByFamily = void 0;
function organizeFullPublishersByFamily(publishers) {
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
    const orderedFamilies = [...familyMap.values()]
        .sort((a, b) => a.name.localeCompare(b.name));
    const orderedPublishers = [];
    const addedIds = new Set();
    for (const family of orderedFamilies) {
        const responsibleId = (_a = family.responsible) === null || _a === void 0 ? void 0 : _a.id;
        // ✅ Primeiro o responsável
        if (responsibleId) {
            const responsible = family.members.find(m => m.id === responsibleId);
            if (responsible && !addedIds.has(responsible.id)) {
                orderedPublishers.push(responsible);
                addedIds.add(responsible.id);
            }
        }
        // ✅ Depois o resto da família
        family.members
            .filter(m => !addedIds.has(m.id))
            .sort((a, b) => a.fullName.localeCompare(b.fullName))
            .forEach(m => {
            orderedPublishers.push(m);
            addedIds.add(m.id);
        });
    }
    // ✅ No final os que não têm família
    singles
        .filter(s => !addedIds.has(s.id))
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .forEach(s => {
        orderedPublishers.push(s);
        addedIds.add(s.id);
    });
    return orderedPublishers;
}
exports.organizeFullPublishersByFamily = organizeFullPublishersByFamily;
