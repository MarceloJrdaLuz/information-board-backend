import { Storage } from '@google-cloud/storage'
import { Request, Response } from 'express-serve-static-core'
import { v4 } from 'uuid'
import { NormalizeFiles } from '../types/normalizeFile'
import fs from 'fs'
import { config } from '../config'

const credentialEnv = process.env.GOOGLE_STORAGE_KEY ? JSON.parse(process.env.GOOGLE_STORAGE_KEY) : undefined
const filePath = `/tmp/google_storage_key.json`

if (!fs.existsSync(filePath) && credentialEnv) {
    const jsonString = JSON.stringify(credentialEnv, null, 2)

    fs.writeFileSync(filePath, jsonString)

    console.log(`Arquivo '${filePath}' criado com sucesso!`)
}

export const storage = new Storage({
    projectId: 'information-board-36dd8',
    keyFilename: filePath
})

export const bucket = storage.bucket('information-board-36dd8.appspot.com')

async function configureBucketCors() {

    const method = ['GET', 'POST', 'PUT', 'DELETE']
    const origin = [config.app_url]
    const responseHeader = ['*']

    await bucket.setCorsConfiguration([
        {
            method,
            origin,
            responseHeader
        },
    ])

    console.log(`Bucket ${bucket} was updated with a CORS config
        to allow ${method} requests from ${origin} sharing
        ${responseHeader} responses across origins`)
}

configureBucketCors().catch(console.error)

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