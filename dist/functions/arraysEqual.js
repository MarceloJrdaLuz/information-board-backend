"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arraysEqual = void 0;
function arraysEqual(a = [], b = []) {
    if (a.length !== b.length)
        return false;
    // Ordena para garantir que a ordem não afete a comparação
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
}
exports.arraysEqual = arraysEqual;
