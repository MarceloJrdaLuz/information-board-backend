import { Response } from "express-serve-static-core"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { talkRepository } from "../../repositories/talkRepository"
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { BodyTalkCreateTypes, BodyTalkImportTypes, BodyTalkUpdateTypes, ParamsTalkTypes } from "./types"
import { messageErrors } from "../../helpers/messageErrors"
import { Request } from "express"
import { allTalks } from "../../helpers/allTalks"

class TalkController {
  async create(req: CustomRequest<BodyTalkCreateTypes>, res: Response) {
    const { number, title } = req.body

    const existingTalk = await talkRepository.findOneBy({ number })
    if (existingTalk) throw new BadRequestError("A talk with this number already exists")

    const newTalk = talkRepository.create({ number, title })
    await talkRepository.save(newTalk)

    return res.status(201).json(newTalk)
  }

  async update(req: CustomRequestPT<ParamsTalkTypes, BodyTalkUpdateTypes>, res: Response) {
    const { talk_id } = req.params
    const { number, title } = req.body

    console.log(talk_id)

    const talk = await talkRepository.findOneBy({ id: talk_id })
    if (!talk) throw new NotFoundError(messageErrors.notFound.talk)

    if (number !== undefined) {
      const existingTalk = await talkRepository.findOneBy({ number })
      if (existingTalk && existingTalk.id !== talk.id) {
        throw new BadRequestError("A talk with this number already exists")
      }
      talk.number = number
    }

    talk.title = title ?? talk.title

    await talkRepository.save(talk)

    return res.json(talk)
  }

  async delete(req: ParamsCustomRequest<ParamsTalkTypes>, res: Response) {
    const { talk_id } = req.params

    const talk = await talkRepository.findOneBy({ id: talk_id })
    if (!talk) throw new NotFoundError(messageErrors.notFound.talk)

    await talkRepository.remove(talk)

    return res.status(200).end()
  }

  async getTalks(req: Request, res: Response) {
    const talks = await talkRepository.find({
      order: { number: "ASC" },
    })

    return res.json(talks)
  }

  async getTalk(req: ParamsCustomRequest<ParamsTalkTypes>, res: Response) {
    const { talk_id } = req.params

    const talk = await talkRepository.findOneBy({ id: talk_id })
    if (!talk) throw new NotFoundError(messageErrors.notFound.talk)

    return res.json(talk)
  }

  async importFromData(_: any, res: Response) {
    const createdTalks = []
    const talks = allTalks

    for (const talkData of talks) {
      const existingTalk = await talkRepository.findOneBy({ number: talkData.number })
      if (existingTalk) {
        continue // se já existe, pula
      }

      const newTalk = talkRepository.create({
        number: talkData.number,
        title: talkData.title,
      })

      await talkRepository.save(newTalk)
      createdTalks.push(newTalk)
    }

    return res.status(201).json({
      message: "Talks imported successfully",
      created: createdTalks.length,
      talks: createdTalks,
    })
  }
}

export default new TalkController()
