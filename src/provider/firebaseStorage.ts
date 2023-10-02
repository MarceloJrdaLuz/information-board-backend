import { Storage } from '@google-cloud/storage'
import { Request, Response } from 'express-serve-static-core'
import { v4 } from 'uuid'
import { NormalizeFiles } from '../types/normalizeFile'
import fs from 'fs'
import { config } from '../config'

const credentialsFilePath = 'storageFirebaseCredentials.json'


if (!fs.existsSync(credentialsFilePath)) {
    const credentials = {
        "type": config.type,
        "project_id": config.project_id,
        "private_key_id": config.private_key_id,
        "private_key": config.private_key,
        "client_email": config.client_email,
        "client_id": config.client_id,
        "auth_uri": config.app_url,
        "token_uri": config.token_uri,
        "auth_provider_x509_cert_url": config.auth_provider_x509_cert_url,
        "client_x509_cert_url": config.client_x509_cert_url,
        "universe_domain": config.universe_domain
    }

    // Converter o objeto JSON em uma string
    const credentialsString = JSON.stringify(credentials)

    // Gravar a string JSON em um arquivo temporário
    fs.writeFileSync('storageFirebaseCredentials.json', credentialsString)
}



export const storage = new Storage({
    projectId: 'information-board-36dd8',
    keyFilename: './storageFirebaseCredentials.json'
})

export const bucket = storage.bucket('information-board-36dd8.appspot.com')

export async function firebaseUpload(req: Request, res: Response, pathSave: string, saveBD: (file: NormalizeFiles) => void) {
    const { size, originalname: fileName, buffer, mimetype, } = req.file as Express.Multer.File

    // Define o nome do arquivo no Firebase Storage
    const key = `${pathSave}/${v4()}-${fileName.replace(/\s/g, '')}`

    // Cria um novo arquivo no bucket do Firebase Storage
    const blob = bucket.file(key)

    // Define os metadados do arquivo
    const metadata = {
        contentType: mimetype,
    }

    // Cria um stream de escrita para o arquivo
    const stream = blob.createWriteStream({
        metadata,
    })

    // Escuta pelo evento 'finish' para finalizar o stream
    stream.on('finish', async () => {
        // Define a URL do arquivo no Firebase Storage
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`
        saveBD({ fileName, size, key, url }) // Retorna a URL do arquivo
    })


    // Escuta pelo evento 'error' para lidar com erros
    stream.on('error', async (err) => {
        console.log(err)
    })

    // Escreve o conteúdo do arquivo no stream
    stream.end(buffer)
}

export async function deleteFirebase(fileName: string | undefined) {

    if (fileName !== undefined) {
        await bucket.file(fileName).delete().then(success => console.log(`${fileName} was deleted!`)).catch(err => console.log(err))
    }
}