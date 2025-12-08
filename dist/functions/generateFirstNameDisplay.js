"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFirstNameDisplay = void 0;
function generateFirstNameDisplay(publishers) {
    // Cria um array de todos os primeiros nomes de cada publisher, considerando nickname se existir
    const firstNamesAll = publishers.map(pub => {
        var _a;
        const baseName = ((_a = pub.nickname) === null || _a === void 0 ? void 0 : _a.trim()) || pub.fullName.trim();
        return baseName.split(" ")[0];
    });
    return publishers.map(pub => {
        var _a;
        const baseName = ((_a = pub.nickname) === null || _a === void 0 ? void 0 : _a.trim()) || pub.fullName.trim();
        const firstName = baseName.split(" ")[0];
        // Se houver outro publisher com o mesmo primeiro nome, exibe o nome completo
        const duplicate = firstNamesAll.filter(fn => fn === firstName).length > 1;
        return {
            ...pub,
            displayName: duplicate ? baseName : firstName
        };
    });
}
exports.generateFirstNameDisplay = generateFirstNameDisplay;
