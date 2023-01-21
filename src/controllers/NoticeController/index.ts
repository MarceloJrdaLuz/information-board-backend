import { Response } from "express";
import { BadRequestError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { noticeRepository } from "../../repositories/noticeRepository";
import { BodyNoticeCreateTypes, CustomRequest } from "./type";

class NoticeController {
    async create(req: CustomRequest<BodyNoticeCreateTypes>, res: Response) {
        const { title, text } = req.body
        const { congregationId } = req.params

        const congregation = congregationRepository.findOneBy({id: congregationId})

        if(!congregation){
            throw new BadRequestError('Congregation not found')
        }

        const newNotice = noticeRepository.create({
            title,
            text
        })

        await noticeRepository.save(newNotice)

    }
}

export default new NoticeController()