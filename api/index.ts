import 'express-async-errors'
import express from 'express'
import { AppDataSource } from '../src/data-source'
import routes from '../src/routes'
import { errorMiddleware } from '../src/middlewares/error'
import cors from 'cors'
import proxyaddr from 'proxy-addr'
import cookieParser from 'cookie-parser'
import '../src/functions/removeSchedulesExpired'

const app = express()

AppDataSource.initialize().then(() => {
    app.use(express.json())
    app.use(cors())
    app.use(routes)
    app.use(cookieParser())

    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])

    app.use(errorMiddleware)

    return app.listen(process.env.PORT)
})

export default app
