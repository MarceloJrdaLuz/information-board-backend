import { Response } from "express";
import { BadRequestError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { noticeRepository } from "../../repositories/noticeRepository";
import { BodyNoticeCreateTypes, ParamsNoticeCreateTypes } from "./type";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";

class NoticeController {
    async create(req: CustomRequestPT<ParamsNoticeCreateTypes, BodyNoticeCreateTypes>, res: Response) {
        const { title, text, expired, startDay, endDay } = req.body
        const { congregation_id } = req.params

        const congregation = await congregationRepository.findOneBy({id: congregation_id})

        
        if(!congregation){
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

    async get(req: ParamsCustomRequest<ParamsNoticeCreateTypes>, res: Response){
        const {congregation_id} = req.params

        const notices = await noticeRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            }, 
        })

       return res.send(notices)
    }
}

export default new NoticeController()