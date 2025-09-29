"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = void 0;
function normalize(str) {
    return str.replace(/\s+/g, " ").trim();
}
exports.normalize = normalize;
