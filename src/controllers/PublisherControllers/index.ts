import { Response } from "express-serve-static-core"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { congregationRepository } from "../../repositories/congregationRepository"
import { Privileges } from "../../types/privileges"
import { BodyPublisherCreateTypes, BodyPublisherUpdateTypes, ParamsGetPublisherTypes, ParamsGetPublishersTypes, ParamsGetPublishersWithCongregationNumberTypes, ParamsPublisherDeleteAndUpdateTypes } from "./types"
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { publisherRepository } from "../../repositories/publisherRepository"
import { messageErrors } from "../../helpers/messageErrors"
import { groupOverseersRepository } from "../../repositories/groupOverseersRepository"
import { groupRepository } from "../../repositories/groupRepository"

class PublisherControler {
  async create(req: CustomRequest<BodyPublisherCreateTypes>, res: Response) {
    const { fullName, nickname, privileges, congregation_id, gender, hope, dateImmersed, birthDate } = req.body

    const privilegesExists = privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))

    const congregation = await congregationRepository.findOneBy({ id: congregation_id })

    if (!congregation) throw new BadRequestError('Congregation not exists')

    // Verificar se o fullName já existe na congregação
    const existingPublisherSomeFullName = await publisherRepository.find({
      where: {
        fullName,
        congregation: {
          id: congregation.id
        }
      }
    })

    if (existingPublisherSomeFullName.length > 0) {
      if (!nickname) {
        throw new BadRequestError('A nickname is required to differentiate the publisher')
      }
      const nicknameAlreadyExists = existingPublisherSomeFullName.some(publisher => publisher.nickname === nickname)

      if (nicknameAlreadyExists) throw new BadRequestError('Nickname already exists too')
    }

    if (!privilegesExists) throw new BadRequestError('Some privilege not exists')

    const newPublisher = publisherRepository.create({
      fullName,
      nickname,
      gender,
      hope,
      dateImmersed,
      birthDate,
      privileges,
      congregation
    })

    await publisherRepository.save(newPublisher).catch(err => {
      throw new BadRequestError(err)
    })

    return res.status(201).json(newPublisher)
  }

  async update(req: CustomRequest<BodyPublisherUpdateTypes>, res: Response) {
    const { id, fullName, nickname, privileges, gender, hope, dateImmersed, birthDate } = req.body

    const publisher = await publisherRepository.findOne({ where: { id } })

    if (!publisher) {
      throw new NotFoundError('Publisher not exists')
    }

    if (privileges) {
      const privilegesExists = privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))
      if (!privilegesExists) {
        throw new BadRequestError('Some privilege not exists')
      }
    }

    if (
      (fullName === undefined || fullName === publisher.fullName) &&
      (gender === undefined || gender === publisher.gender) &&
      (hope === undefined || hope === publisher.hope) &&
      (nickname === undefined || nickname === publisher.nickname) &&
      (birthDate === undefined || birthDate === publisher.birthDate) &&
      privileges === undefined
    ) {
      throw new BadRequestError('Any change detected')
    }

    if (fullName !== publisher.fullName) {
      const existingPublisherSomeFullName = await publisherRepository.find({
        where: {
          fullName,
          congregation: { id: publisher.congregation.id }
        }
      })

      if (!nickname) {
        throw new BadRequestError('This fullname already exists in the congregation, a nickname is required to differentiate the publisher')
      }

      const nicknameAlreadyExists = existingPublisherSomeFullName.some(publisher => publisher.nickname === nickname)

      if (nicknameAlreadyExists) throw new BadRequestError('Nickname already exists too')
    }

    // Atualizar as propriedades do publisher
    publisher.fullName = fullName !== undefined ? fullName : publisher.fullName
    publisher.nickname = nickname !== undefined ? nickname : publisher.nickname
    publisher.gender = gender !== undefined ? gender : publisher.gender
    publisher.hope = hope !== undefined ? hope : publisher.hope
    publisher.privileges = privileges !== undefined ? privileges : publisher.privileges
    publisher.birthDate = birthDate !== undefined ? birthDate : publisher.birthDate
    publisher.dateImmersed = dateImmersed !== undefined ? dateImmersed : publisher.dateImmersed

    await publisherRepository.save(publisher)

    return res.status(201).json(publisher)
  }

  async delete(req: ParamsCustomRequest<ParamsPublisherDeleteAndUpdateTypes>, res: Response) {
    const { publisher_id: id } = req.params

    const publisher = await publisherRepository.findOne({
      where: {
        id
      },
      relations: ['groupOverseers']
    })

    if (!publisher) throw new BadRequestError('Publisher not exists')

    await publisherRepository.remove(publisher)

    return res.status(200).end()
  }

  async getPublishers(req: ParamsCustomRequest<ParamsGetPublishersTypes>, res: Response) {
    const { congregation_id } = req.params


    const congregation = await congregationRepository.findOneBy({ id: congregation_id })

    if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation)

    const publishers = await publisherRepository.find({
      where: {
        congregation: {
          id: congregation_id
        }
      }, relations: ['group']
    }).catch(err => console.log(err))

    return res.status(200).json(publishers)
  }

  async getPublishersWithCongregatioNumber(req: ParamsCustomRequest<ParamsGetPublishersWithCongregationNumberTypes>, res: Response) {
    const { congregationNumber } = req.params

    const congregation = await congregationRepository.findOneBy({ number: congregationNumber })

    if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation)

    const publishers = await publisherRepository.find({
      where: {
        congregation: {
          id: congregation.id
        }
      },
      select: ['fullName', 'nickname', "congregation"],
    })

    const publishersNames = publishers.map(publisher => ({
      fullName: publisher.fullName,
      nickname: publisher.nickname,
      congregation_id: congregation.id
    }))

    return res.status(200).json(publishersNames)
  }

  async getPublisher(req: ParamsCustomRequest<ParamsGetPublisherTypes>, res: Response) {
    const { publisher_id } = req.params

    const publisher = await publisherRepository.findOneBy({ id: publisher_id })

    if (!publisher) throw new NotFoundError(messageErrors.notFound.publisher)

    return res.status(200).json(publisher)
  }
}

export default new PublisherControler()