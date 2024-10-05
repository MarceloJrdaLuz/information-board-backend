# Projeto backend!

## 💻 Pré-requisitos

1. Antes de começar você precisa instalar o banco de dados Postgres, e usar as chaves `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` e `DB_NAME` para configurar o banco. (Deixe a chave `ENVIRONMENT` como `local` ou `prod` ). Caso você esteja usando um banco na nuvem que exija o um certificado .pem, pode usar a variável `SSL_CERTIFICATE`, que ela será descriptografada e convertida em uma string.
2. Para usar o recurso do `Esqueci minha senha` você precisará ter um e-mail outlook configurado para ser usado como transporter do token de redefinição da senha. Então na chave `NODEMAILER_HOST` pode ser usado o host `smtp-mail.outlook.com`, e a chave `NODEMAILER_PORT` usando a porta `587`. E use as variaveis` NODEMAILER_USER` e `NODEMAILER_PASS` para colocar seu email e senha.  Ou terá que adaptar outro transporter. 

## 🚀 Rodando projeto local

Para rodar o backend, siga estas etapas:

1. Na raiz do projeto do back, duplique o arquivo `.env.exemple` e renomeie essa cópia para `.env`. Preencha as váriaveis de ambiente seguindo as instruções abaixo.
2. Você precisa criar um hash que vai ser usado na aplicação para geração de Tokens únicos e coloca-lo na chave `JWT_PASS`.
3. Defina na variável `PORT`, que porta vai rodar a api.
4. Nesse projeto é necesário fazer upload de arquivos para um storage. No momento uma boa opção é o Firebase que tem 5gb no plano free. Se for optar por essa opção também pode deixar a variavel `STORAGE_TYPE` como `firebase`, e criar um storage no google para ser usado pela aplicação. Como o firebase exige um certificado em json, você pode converter o cretendial.json em um json.string, e colocar esse Json na variável `GOOGLE_STORAGE_KEY`. Caso queira apenas salvar os arquivos numa pasta temporária no próprio servidor local, use o `STORAGE_TYPE` = `local`
5. Use a variável `APP_URL` para definir a url base do frontend. 
6. Instale as dependências rodando `npm i`.
7. Suba a aplicação rodando `npm start`. O serviço vai rodar em `http://localhost:3000/` ou para a porta que você definiu. Agora você já pode usar a aplicação frontend pra interagir.