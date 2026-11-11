import 'express-async-errors'
import express from 'express'
import { AppDataSource } from './data-source'
import routes from './routes'
import { errorMiddleware } from './middlewares/error'
import cors from 'cors'
import proxyaddr from 'proxy-addr'
import cookieParser from 'cookie-parser'
import cron from 'node-cron'
import { config } from './config'
import { scheduleReminderService } from './services/ScheduleReminderService'

AppDataSource.initialize().then(() => {
    const corsOptions = {
        origin: config.app_url
    }
    const app = express()
    app.use(express.json())
    app.use(cors(corsOptions))
    app.use(cookieParser())
    app.use(routes)

    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])

    app.use(errorMiddleware)

    // Cron job diário às 12:00 (horário de Brasília) para verificação e envio de push aos responsáveis por programações
    cron.schedule('0 12 * * *', async () => {
        try {
            console.log('⏰ [Cron] Executando verificação diária de lembretes de programações...')
            const result = await scheduleReminderService.dispatchDailyScheduleReminders()
            console.log(`✅ [Cron] Lembretes processados: ${result.notificationsSent} notificações push enviadas.`)
        } catch (err) {
            console.error('❌ [Cron] Erro ao disparar lembretes diários de programações:', err)
        }
    }, {
        timezone: 'America/Sao_Paulo'
    })

    return app.listen(process.env.PORT)
})
