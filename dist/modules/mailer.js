"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const nodemailer_express_handlebars_1 = __importDefault(require("nodemailer-express-handlebars"));
const config_1 = require("../config");
const transport = nodemailer_1.default.createTransport({
    service: 'outlook',
    auth: {
        user: config_1.config.nodemailer_user,
        pass: config_1.config.nodemailer_pass
    },
    tls: {
        rejectUnauthorized: false
    }
});
transport.use('compile', (0, nodemailer_express_handlebars_1.default)({
    viewEngine: {
        defaultLayout: undefined,
        partialsDir: path_1.default.resolve('./src/resources/mail/')
    },
    viewPath: path_1.default.resolve('./src/resources/mail/'),
    extName: '.html'
}));
module.exports = transport;
