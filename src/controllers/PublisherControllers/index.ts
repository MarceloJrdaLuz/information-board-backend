import { Response } from "express-serve-static-core"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { congregationRepository } from "../../repositories/congregationRepository"
import { Privileges } from "../../types/privileges"
import { BodyPublisherCreateTypes, BodyPublisherUpdateTypes, ParamsGetPublisherTypes, ParamsGetPublishersTypes, ParamsGetPublishersWithCongregationNumberTypes, ParamsPublisherDeleteAndUpdateTypes } from "./types"
import { CustomRequest, ParamsCustomRequest } from "../../types/customRequest"
import { publisherRepository } from "../../repositories/publisherRepository"
import { messageErrors } from "../../helpers/messageErrors"
import { emergencyContactRepository } from "../../repositories/emergencyContact"
import { In } from "typeorm"
import { arraysEqual } from "../../functions/arraysEqual"

class PublisherControler {
  async create(req: CustomRequest<BodyPublisherCreateTypes>, res: Response) {
    const { fullName, nickname, privileges, congregation_id, gender, hope, dateImmersed, birthDate, pioneerMonths, startPioneer, situation, phone, address, emergencyContactId } = req.body

    if (privileges) {
      if (privileges.includes(Privileges.PIONEIROAUXILIAR) && !pioneerMonths) {
        throw new BadRequestError('You must provide the "pioneerMonths" field when assigning the "Pioneiro Auxiliar" privilege')
      }

      if (privileges.includes(Privileges.PIONEIROREGULAR) && !startPioneer) {
        throw new BadRequestError('You must provide the "startPioneer" field when assigning the "Pioneiro Regular" ou "Pioneiro auxiliar indeterminado" privilege')
      }
    }

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
      pioneerMonths,
      congregation,
      startPioneer,
      situation,
      phone,
      address
    })

    if (emergencyContactId) {
      const contact = await emergencyContactRepository.findOneBy({ id: emergencyContactId });
      newPublisher.emergencyContact = contact ?? null; // permite que seja null
    }
    await publisherRepository.save(newPublisher).catch(err => {
      throw new BadRequestError(err)
    })

    return res.status(201).json(newPublisher)
  }

  async update(req: CustomRequest<BodyPublisherUpdateTypes>, res: Response) {
    const { publisher_id: id } = req.params
    const { fullName, nickname, privileges, gender, hope, dateImmersed, birthDate, pioneerMonths, situation, phone, address, startPioneer, emergencyContactId } = req.body

    const publisher = await publisherRepository.findOne({ where: { id } })

    if (!publisher) {
      throw new NotFoundError('Publisher not exists')
    }

    if (privileges) {
      if (privileges.includes(Privileges.PIONEIROAUXILIAR) && !pioneerMonths) {
        throw new BadRequestError('You must provide the "pioneerMonths" field when assigning the "PIONEIRO AUXILIAR" privilege')
      }

      if (privileges.includes(Privileges.PIONEIROREGULAR) && !startPioneer) {
        throw new BadRequestError('You must provide the "startRegularPioneer" field when assigning the "Pioneiro Regular" privilege')
      }

      const privilegesExists = privileges?.every(privilege => Object.values(Privileges).includes(privilege as Privileges))
      if (!privilegesExists) {
        throw new BadRequestError('Some privilege not exists')
      }
    }

    if (emergencyContactId) {
      const contact = await emergencyContactRepository.findOneBy({ id: emergencyContactId });
      publisher.emergencyContact = contact ?? null; // permite que seja null
    }
    // const noChange =
    //   (fullName === undefined || fullName === publisher.fullName) &&
    //   (gender === undefined || gender === publisher.gender) &&
    //   (hope === undefined || hope === publisher.hope) &&
    //   (nickname === undefined || nickname === publisher.nickname) &&
    //   (birthDate === undefined || birthDate?.toISOString() === publisher.birthDate?.toISOString()) &&
    //   (pioneerMonths === undefined || arraysEqual(pioneerMonths, publisher.pioneerMonths)) &&
    //   (situation === undefined || situation === publisher.situation) &&
    //   (startPioneer === undefined || startPioneer?.toISOString() === publisher.startPioneer?.toISOString()) &&
    //   (dateImmersed === undefined || dateImmersed?.toISOString() === publisher.dateImmersed?.toISOString()) &&
    //   (phone === undefined || phone === publisher.phone) &&
    //   (address === undefined || address === publisher.address) &&
    //   (privileges === undefined || arraysEqual(privileges, publisher.privileges));

    // if (noChange) {
    //   throw new BadRequestError('Any change detected');
    // }

    if (fullName !== publisher.fullName) {
      const existingPublisherSomeFullName = await publisherRepository.find({
        where: {
          fullName,
          congregation: {
            id: publisher.congregation.id
          }
        }
      })

      if (existingPublisherSomeFullName.length > 0 && !nickname) {
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
    publisher.pioneerMonths = pioneerMonths !== undefined ? pioneerMonths : publisher.pioneerMonths
    publisher.birthDate = birthDate !== undefined ? birthDate : publisher.birthDate
    publisher.dateImmersed = dateImmersed !== undefined ? dateImmersed : publisher.dateImmersed
    publisher.situation = situation !== undefined ? situation : publisher.situation
    publisher.startPioneer = startPioneer !== undefined ? startPioneer : publisher.startPioneer
    publisher.phone = phone !== undefined ? phone : publisher.phone
    publisher.address = address !== undefined ? address : publisher.address

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
      congregation_id: congregation.id,
      congregation_number: congregation.number
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