import 'express-async-errors'
import express from 'express'
import { AppDataSource } from './data-source'
import routes from './routes'
import { errorMiddleware } from './middlewares/error'
import cors from 'cors'
import proxyaddr from 'proxy-addr'
import cookieParser from 'cookie-parser'
import { config } from './config'

AppDataSource.initialize().then(() => {
    const corsOptions = {
        origin: config.app_url
    }
    const app = express()
    app.use(express.json())
    app.use(cors(corsOptions))
    console.log(corsOptions)
    app.use(cookieParser())
    app.use(routes)

    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])

    app.use(errorMiddleware)

    return app.listen(process.env.PORT)
})
