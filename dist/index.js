"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middlewares/error");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("./config");
const ScheduleReminderService_1 = require("./services/ScheduleReminderService");
data_source_1.AppDataSource.initialize().then(() => {
    const corsOptions = {
        origin: config_1.config.app_url
    };
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(corsOptions));
    app.use((0, cookie_parser_1.default)());
    app.use(routes_1.default);
    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
    app.use(error_1.errorMiddleware);
    // Cron job diário às 12:00 (horário de Brasília) para verificação e envio de push aos responsáveis por programações
    node_cron_1.default.schedule('0 12 * * *', async () => {
        try {
            console.log('⏰ [Cron] Executando verificação diária de lembretes de programações...');
            const result = await ScheduleReminderService_1.scheduleReminderService.dispatchDailyScheduleReminders();
            console.log(`✅ [Cron] Lembretes processados: ${result.notificationsSent} notificações push enviadas.`);
        }
        catch (err) {
            console.error('❌ [Cron] Erro ao disparar lembretes diários de programações:', err);
        }
    }, {
        timezone: 'America/Sao_Paulo'
    });
    return app.listen(process.env.PORT);
});
