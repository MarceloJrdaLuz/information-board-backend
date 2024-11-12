import path from 'path'
import nodemailer from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'
import { config } from '../config';

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.nodemailer_user,
        pass: process.env.PASS
    },
    tls: {
        rejectUnauthorized: false
    }
})

transport.use('compile', hbs({
    viewEngine: {
        defaultLayout: undefined,
        partialsDir: path.resolve('./src/resources/mail/')
    },
    viewPath: path.resolve('./src/resources/mail/'),
    extName: '.html'
}))

module.exports = transport