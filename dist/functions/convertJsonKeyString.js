"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertJsonKeyToString = void 0;
const fs_1 = __importDefault(require("fs"));
function convertJsonKeyToString(fileNameToConvert) {
    if (fs_1.default.existsSync(fileNameToConvert)) {
        try {
            const fileContent = fs_1.default.readFileSync(fileNameToConvert, 'utf-8'); // Lê o conteúdo do arquivo
            const jsonString = JSON.stringify(fileContent); // Converte o conteúdo para uma string JSON
            const newFilePath = 'google_storage_key_string.json';
            fs_1.default.writeFileSync(newFilePath, jsonString);
        }
        catch (error) {
            console.error('Erro ao ler ou processar o arquivo JSON:', error);
        }
    }
}
exports.convertJsonKeyToString = convertJsonKeyToString;
