import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { noticeRepository } from "../../repositories/noticeRepository";
import { BodyNoticeCreateTypes, ParamsNoticeCreateTypes, ParamsNoticeUpdateTypes } from "./types";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import { messageErrors } from "../../helpers/messageErrors";

class NoticeController {
    async create(req: CustomRequestPT<ParamsNoticeCreateTypes, BodyNoticeCreateTypes>, res: Response) {
        const { title, text, expired, startDay, endDay } = req.body
        const { congregation_id } = req.params

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })


        if (!congregation) {
            throw new BadRequestError('Congregation not found')
        }

        const newNotice = noticeRepository.create({
            title,
            text,
            expired,
            startDay,
            endDay,
            congregation
        })

        await noticeRepository.save(newNotice).then(suc => {
            return res.status(201).json(suc)
        }).catch(err => {
            console.log(err)
        })

    }

    async getNotices(req: ParamsCustomRequest<ParamsNoticeCreateTypes>, res: Response) {
        const { congregation_id } = req.params

        const notices = await noticeRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            },
        })

        return res.send(notices)
    }

    async getNotice(req: ParamsCustomRequest<ParamsNoticeUpdateTypes>, res: Response) {
        const { notice_id } = req.params

        const notice = await noticeRepository.findOneBy({ id: notice_id })

        if (!notice) throw new NotFoundError(messageErrors.notFound.notice)

        return res.status(200).json(notice)
    }

    async delete(req: ParamsCustomRequest<ParamsNoticeUpdateTypes>, res: Response) {
        const { notice_id } = req.params

        const notice = await noticeRepository.findOneBy({ id: notice_id })

        if (!notice) {
            throw new NotFoundError(messageErrors.notFound.notice)
        }
        
        await noticeRepository.remove(notice)

        return res.status(200).end()
    }
}

export default new NoticeController()