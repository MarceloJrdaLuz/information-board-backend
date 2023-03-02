import path from 'path'
import nodemailer from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'
import { config } from '../config';

const transport = nodemailer.createTransport({
    //@ts-expect-error
    host: config.nodemailer_host,
    secure: false,
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    },
    port: config.nodemailer_port,
    auth: {
        user: config.nodemailer_user,
        pass: config.nodemailer_pass
    }
});

transport.use('compile', hbs({
    viewEngine: {
        defaultLayout: undefined,
        partialsDir: path.resolve('./src/resources/mail/')
    },
    viewPath: path.resolve('./src/resources/mail/'),
    extName: '.html'
}))

module.exports = transport