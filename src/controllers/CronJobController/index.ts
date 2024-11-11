import { Response, Request } from "express";

class CronJobController {
    async deleteNotices(req: Request, res: Response) {
        console.log('Task finished')
    }
}

export default new CronJobController()