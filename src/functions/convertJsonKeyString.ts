import fs from 'fs'

export function convertJsonKeyToString(fileNameToConvert: string ){
    if (fs.existsSync(fileNameToConvert)){
        try {
            const fileContent = fs.readFileSync(fileNameToConvert, 'utf-8'); // Lê o conteúdo do arquivo
            const jsonString = JSON.stringify(fileContent); // Converte o conteúdo para uma string JSON
        
            const newFilePath = 'google_storage_key_string.json';
            fs.writeFileSync(newFilePath, jsonString);
        
          } catch (error) {
            console.error('Erro ao ler ou processar o arquivo JSON:', error);
          }
    }
}