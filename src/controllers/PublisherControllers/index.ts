import { Response } from "express-serve-static-core"
import { In, Not } from "typeorm"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { privilegePTtoEN, translatePrivilegesPTToEN } from "../../helpers/privilegesTranslations"
import { congregationRepository } from "../../repositories/congregationRepository"
import { emergencyContactRepository } from "../../repositories/emergencyContact"
import { privilegeRepository } from "../../repositories/privilegeRepository"
import { publisherPrivilegeRepository } from "../../repositories/publisherPrivilegeRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { userRepository } from "../../repositories/userRepository"
import { CustomRequest, ParamsCustomRequest } from "../../types/customRequest"
import { Privileges } from "../../types/privileges"
import { BodyPublisherCreateTypes, BodyPublisherUpdateTypes, ParamsGetPublisherTypes, ParamsGetPublishersTypes, ParamsGetPublishersWithCongregationNumberTypes, ParamsPublisherDeleteAndUpdateTypes, ParamsUnLinkPublisherToUserTypes } from "./types"

class PublisherControler {
  async create(req: CustomRequest<BodyPublisherCreateTypes>, res: Response) {
    const { fullName, nickname, privileges, congregation_id, gender, hope, dateImmersed, birthDate, pioneerMonths, startPioneer, situation, phone, address, emergencyContact_id } = req.body

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

    if (emergencyContact_id) {
      const contact = await emergencyContactRepository.findOneBy({ id: emergencyContact_id })
      newPublisher.emergencyContact = contact ?? null // permite que seja null
    }
    await publisherRepository.save(newPublisher).catch(err => {
      throw new BadRequestError(err)
    })

    if (privileges?.length) {
      for (const privilegePT of privileges) {
        const privilegeEN = privilegePTtoEN[privilegePT];
        if (!privilegeEN) continue; // ou lançar erro se quiser validar

        const privilegeEntity = await privilegeRepository.findOneBy({ name: privilegeEN });
        if (privilegeEntity) {
          await publisherPrivilegeRepository.save({
            publisher: newPublisher,
            privilege: privilegeEntity,
            startDate: startPioneer ?? null,
            endDate: null
          });
        }
      }
    }

    return res.status(201).json(newPublisher)
  }

  async update(req: CustomRequest<BodyPublisherUpdateTypes>, res: Response) {
    const { publisher_id: id } = req.params
    const { fullName, nickname, privileges, gender, hope, dateImmersed, birthDate, pioneerMonths, situation, phone, address, startPioneer, emergencyContact_id } = req.body

    const publisher = await publisherRepository.findOne({
      where: { id },
      relations: ["congregation"]
    })

    if (!publisher) {
      throw new NotFoundError(messageErrors.notFound.publisher)
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

    if (emergencyContact_id) {
      const contact = await emergencyContactRepository.findOneBy({ id: emergencyContact_id })
      publisher.emergencyContact = contact ?? null // permite que seja null
    }

    if (fullName && fullName !== publisher.fullName) {
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

    const privilegesEN = translatePrivilegesPTToEN(privileges ?? [])
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
    publisher.privileges = privileges && privileges?.length > 0 ? privileges : publisher.privileges


    await publisherRepository.save(publisher)

    if (privileges && privileges.length > 0) {
      const privilegesEN = translatePrivilegesPTToEN(privileges)

      // Busca entidades reais dos privilégios em inglês
      const privilegeEntities = await privilegeRepository.findBy({
        name: In(privilegesEN)
      })

      // Extrai os IDs
      const privilegeIds = privilegeEntities.map(p => p.id)

      // Remove privilégios antigos que não estão mais na lista
      await publisherPrivilegeRepository.delete({
        publisher: { id: publisher.id },
        privilege: { id: Not(In(privilegeIds)) }
      })

      for (const privilegeName of privilegesEN) {
        const privilegeEntity = await privilegeRepository.findOneBy({ name: privilegeName })
        if (!privilegeEntity) continue

        const exists = await publisherPrivilegeRepository.findOne({
          where: { publisher: { id: publisher.id }, privilege: { id: privilegeEntity.id } }
        })
        if (!exists) {
          await publisherPrivilegeRepository.save({
            publisher,
            privilege: privilegeEntity,
            startDate: startPioneer ?? null,
            endDate: null
          })
        }
      }
    }
    return res.status(201).json(publisher)
  }

  async delete(req: ParamsCustomRequest<ParamsPublisherDeleteAndUpdateTypes>, res: Response) {
    const { publisher_id: id } = req.params

    const publisher = await publisherRepository.findOne({
      where: {
        id
      }
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
      }, relations: ['group', 'congregation', "emergencyContact", "hospitalityGroup" ]
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
      select: ['fullName', 'nickname', "congregation", "id"],
    })

    const publishersNames = publishers.map(publisher => ({
      id: publisher.id,
      fullName: publisher.fullName,
      nickname: publisher.nickname,
      congregation_id: congregation.id,
      congregation_number: congregation.number
    }))

    return res.status(200).json(publishersNames)
  }

  async getPublisher(req: ParamsCustomRequest<ParamsGetPublisherTypes>, res: Response) {
    const { publisher_id } = req.params

    const publisher = await publisherRepository.findOne({
      where: {
        id: publisher_id
      },
      relations: ["user", "emergencyContact"],
    })

    if (!publisher) throw new NotFoundError(messageErrors.notFound.publisher)

    return res.status(200).json(publisher)
  }

  async unlinkPublisherFromUser(req: ParamsCustomRequest<ParamsUnLinkPublisherToUserTypes>, res: Response) {
    const { publisher_id } = req.params

    const publisher = await publisherRepository.findOne({
      where: {
        id: publisher_id
      },
      relations: ["user"]
    })

    if (!publisher) {
      throw new NotFoundError(messageErrors.notFound.publisher)
    }


    if (!publisher.user) {
      throw new BadRequestError("This publisher is not linked to any user")
    }

    const user = publisher.user

    // remove vínculo
    user.publisher = null
    await userRepository.save(user)

    return res.json({ message: "Publisher unlinked successfully" })
  }

}

export default new PublisherControler()