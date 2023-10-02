import 'express-async-errors'
import express from 'express'
import { AppDataSource } from './data-source'
import routes from './routes'
import { errorMiddleware } from './middlewares/error'
import cors from 'cors'
const proxyaddr = require('proxy-addr')
import cookieParser from 'cookie-parser'
import './functions/removeSchedulesExpired'

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
