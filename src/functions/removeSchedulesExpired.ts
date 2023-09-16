import { schedule } from 'node-cron'
import { noticeRepository } from '../repositories/noticeRepository'
import { LessThan } from 'typeorm'

schedule('43 16 * * *', async () => {
    const now = new Date()
    const expiredRecover = await noticeRepository.find({
        where: {
            expired: LessThan(now)
        }
    })

    // Exclua os registros encontrados
    if (expiredRecover.length > 0) {
        await noticeRepository.remove(expiredRecover)
    }
})