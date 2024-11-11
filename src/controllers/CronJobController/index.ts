import { Response, Request } from "express"
import { noticeRepository } from "../../repositories/noticeRepository"
import { LessThanOrEqual, LessThan } from "typeorm"
import { NotFoundError } from "../../helpers/api-errors"

class CronJobController {
    async deleteExpiredNotices(req: Request, res: Response) {
        const expiredNotices = await noticeRepository.find({
            where: {
                expired: LessThan(new Date())
            }
        })

        if (expiredNotices.length === 0) {
            throw new NotFoundError("No expired notices found")
        }

        try {
            await noticeRepository.remove(expiredNotices)
            return res.status(200).json({ message: "Expired notices deleted", notices: expiredNotices })
        } catch (error) {
            console.log(error)
            throw new Error("Error deleting expired notices")
        }

    }
}

export default new CronJobController()