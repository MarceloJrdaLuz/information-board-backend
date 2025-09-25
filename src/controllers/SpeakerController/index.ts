import { Response } from "express-serve-static-core"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { speakerRepository } from "../../repositories/speakerRepository"
import { talkRepository } from "../../repositories/talkRepository"
import { findPublisherWithPrivilege, publisherRepository } from "../../repositories/publisherRepository"
import { congregationRepository } from "../../repositories/congregationRepository"
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import {
  BodySpeakerCreateTypes,
  BodySpeakerUpdateTypes,
  ParamsGetSpeakerTypes,
  ParamsSpeakerTypes,
} from "./types"
import { In } from "typeorm"
import { Publisher } from "../../entities/Publisher"
import { decoder } from "../../middlewares/permissions"
import { userRepository } from "../../repositories/userRepository"
import { Request } from "express"

class SpeakerController {
  async create(req: CustomRequest<BodySpeakerCreateTypes>, res: Response) {
    const { fullName, phone, address, originCongregation_id, publisher_id, talk_ids } = req.body

    console.log(fullName, phone, address, originCongregation_id, publisher_id, talk_ids)

    const requestUser = await decoder(req)
    const userReq = await userRepository.findOne({
      where: {
        id: requestUser.id
      },
      select: ["congregation"]
    })

    let originCongregation = await congregationRepository.findOneBy({ id: originCongregation_id })
    if (!originCongregation) throw new NotFoundError(messageErrors.notFound.originCongregation)

    let publisher: Publisher | null = null
    let speakerFullName = fullName
    let speakerPhone = phone
    let speakerAddress = address

    if (publisher_id) {
      const publisher = await findPublisherWithPrivilege(publisher_id, "Speaker")

      if (!publisher) throw new BadRequestError("Publisher not found or does not have 'Speaker'")

      if (publisher.congregation.id !== originCongregation_id) {
        throw new BadRequestError("Publisher does not belong to the same congregation as the speaker")
      }
      // Preenche os dados do speaker com os dados do publisher
      speakerFullName = publisher.fullName
      speakerPhone = publisher.phone
      speakerAddress = publisher.address
      originCongregation = publisher.congregation
    }
    const talks = talk_ids && talk_ids.length > 0
      ? await talkRepository.findBy({
        id: In(talk_ids)
      })
      : []

    try {
      const newSpeaker = speakerRepository.create({
        fullName: speakerFullName,
        phone: speakerPhone,
        address: speakerAddress,
        creatorCongregation: userReq?.congregation,
        originCongregation,
        publisher,
        talks,
      })
      await speakerRepository.save(newSpeaker)
      return res.status(201).json(newSpeaker)
    } catch (error: any) {
      if (error.code === "23505") { // Postgres unique violation
        throw new BadRequestError("A speaker with this name and publisher already exists in your congregation")
      }
      throw error
    }
  }

  async update(req: CustomRequestPT<ParamsSpeakerTypes, BodySpeakerUpdateTypes>, res: Response) {
    const { speaker_id } = req.params
    const { fullName, phone, address, publisher_id, talk_ids, originCongregation_id } = req.body

    const speaker = await speakerRepository.findOne({
      where: { id: speaker_id },
      relations: ["publisher", "talks"],
    })
    if (!speaker) throw new NotFoundError(messageErrors.notFound.speaker)

    speaker.fullName = fullName ?? speaker.fullName
    speaker.phone = phone ?? speaker.phone
    speaker.address = address ?? speaker.address

    if (publisher_id) {
      // Novo publisher enviado → atualizar dados e congregação do Speaker
      const newPublisher = await publisherRepository.findOne({
        where: { id: publisher_id },
        relations: ["congregation"],
      })
      if (!newPublisher) throw new NotFoundError(messageErrors.notFound.publisher)

      // Atualiza dados do Speaker com o Publisher
      speaker.fullName = newPublisher.fullName
      speaker.phone = newPublisher.phone
      speaker.address = newPublisher.address
      speaker.originCongregation = newPublisher.congregation
      speaker.publisher = newPublisher
    } else {
      // Sem publisher_id → desvincula publisher
      speaker.publisher = null
      speaker.fullName = fullName ?? speaker.fullName
      speaker.phone = phone ?? speaker.phone
      speaker.address = address ?? speaker.address

      if (originCongregation_id) {
        const newCongregation = await congregationRepository.findOneBy({ id: originCongregation_id })
        if (!newCongregation) throw new NotFoundError(messageErrors.notFound.congregation)
        speaker.originCongregation = newCongregation
      }
    }

    if (talk_ids !== undefined) {
      speaker.talks = talk_ids.length > 0
        ? await talkRepository.findBy({
          id: In(talk_ids)
        })
        : []
    }

    await speakerRepository.save(speaker)
    return res.json(speaker)
  }

  async delete(req: ParamsCustomRequest<ParamsSpeakerTypes>, res: Response) {
    const { speaker_id } = req.params
    const speaker = await speakerRepository.findOneBy({ id: speaker_id })
    if (!speaker) throw new NotFoundError(messageErrors.notFound.speaker)

    await speakerRepository.remove(speaker)
    return res.status(200).end()
  }

  async getSpeakers(req: ParamsCustomRequest<ParamsGetSpeakerTypes>, res: Response) {
    const requestUser = await decoder(req)
    const userReq = await userRepository.findOne({
      where: {
        id: requestUser.id
      },
    })
    const speakers = await speakerRepository.find({
      where: { creatorCongregation: { id: userReq?.congregation.id } },
      relations: ["originCongregation", "talks"],
      order: { fullName: "ASC" },
    })
    console.log(speakers)
    return res.json(speakers)
  }

  async getPublishersSpeaker(req: Request, res: Response) {
    const requestUser = await decoder(req)
    const userReq = await userRepository.findOne({
      where: {
        id: requestUser.id
      },
    })
    const publishers = await publisherRepository.find({
      where: { congregation: { id: userReq?.congregation.id } },
      relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
      order: { fullName: "ASC" },
    })

    const speakers = publishers.filter(pp =>
      pp.privilegesRelation.some(p => p.privilege.name === "Speaker")
    )

    return res.json(speakers)
  }

  async getSpeaker(req: ParamsCustomRequest<ParamsSpeakerTypes>, res: Response) {
    const { speaker_id } = req.params
    const speaker = await speakerRepository.findOne({
      where: { id: speaker_id },
      relations: ["originCongregation"]
    })
    if (!speaker) throw new NotFoundError(messageErrors.notFound.speaker)

    return res.json(speaker)
  }
}

export default new SpeakerController()
