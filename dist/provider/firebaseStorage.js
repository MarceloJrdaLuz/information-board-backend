"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFirebase = exports.firebaseUpload = exports.bucket = exports.storage = void 0;
const storage_1 = require("@google-cloud/storage");
const uuid_1 = require("uuid");
const config_1 = require("../config");
exports.storage = new storage_1.Storage({
    projectId: 'information-board-36dd8',
    keyFilename: JSON.parse(config_1.config.google_storage_key)
});
exports.bucket = exports.storage.bucket('information-board-36dd8.appspot.com');
async function firebaseUpload(req, res, pathSave, saveBD) {
    const { size, originalname: fileName, buffer, mimetype, } = req.file;
    // Define o nome do arquivo no Firebase Storage
    const key = `${pathSave}/${(0, uuid_1.v4)()}-${fileName.replace(/\s/g, '')}`;
    // Cria um novo arquivo no bucket do Firebase Storage
    const blob = exports.bucket.file(key);
    // Define os metadados do arquivo
    const metadata = {
        contentType: mimetype,
    };
    // Cria um stream de escrita para o arquivo
    const stream = blob.createWriteStream({
        metadata,
    });
    // Escuta pelo evento 'finish' para finalizar o stream
    stream.on('finish', async () => {
        // Define a URL do arquivo no Firebase Storage
        const url = `https://firebasestorage.googleapis.com/v0/b/${exports.bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
        saveBD({ fileName, size, key, url }); // Retorna a URL do arquivo
    });
    // Escuta pelo evento 'error' para lidar com erros
    stream.on('error', async (err) => {
        console.log(err);
    });
    // Escreve o conteúdo do arquivo no stream
    stream.end(buffer);
}
exports.firebaseUpload = firebaseUpload;
async function deleteFirebase(fileName) {
    if (fileName !== undefined) {
        await exports.bucket.file(fileName).delete().then(success => console.log(`${fileName} was deleted!`)).catch(err => console.log(err));
    }
}
exports.deleteFirebase = deleteFirebase;
