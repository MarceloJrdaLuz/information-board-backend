import { Response, Request } from "express";
import { noticeRepository } from "../../repositories/noticeRepository";
import { LessThanOrEqual } from "typeorm";

class CronJobController {
    async deleteNotices(req: Request, res: Response) {
        console.log('Task finished')

        const notices = await noticeRepository.find({where: {
            expired: LessThanOrEqual(new Date())
        }})

        console.log(notices)

        res.send().json({message: "Concluido"})
    }
}

export default new CronJobController()