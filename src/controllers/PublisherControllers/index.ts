import dayjs from "dayjs"
import { Response } from "express-serve-static-core"
import { In, MoreThanOrEqual, Not } from "typeorm"
import { CongregationType } from "../../entities/Congregation"
import { GroupOverseers } from "../../entities/GroupOverseers"
import { HospitalityGroup } from "../../entities/HospitalityGroup."
import { Publisher } from "../../entities/Publisher"
import { Speaker } from "../../entities/Speaker"
import { User } from "../../entities/User"
import { convertMeetingDayPortugueseToIso } from "../../functions/cleaningFunctions"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { privilegePTtoEN, translatePrivilegesPTToEN } from "../../helpers/privilegesTranslations"
import { cleaningScheduleRepository } from "../../repositories/cleaningScheduleRepository"
import { congregationRepository } from "../../repositories/congregationRepository"
import { emergencyContactRepository } from "../../repositories/emergencyContact"
import { externalTalkRepository } from "../../repositories/externalTalkRepository"
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository"
import { hospitalityAssignmentRepository } from "../../repositories/hospitalityAssignmentRepository"
import { midweekMeetingPartRepository } from "../../repositories/midweekMeetingPartRepository"
import { midweekScheduleRepository } from "../../repositories/midweekScheduleRepository"
import { privilegeRepository } from "../../repositories/privilegeRepository"
import { publicWitnessAssignmentRepository } from "../../repositories/publicWitnessAssignmentRepository"
import { publisherPrivilegeRepository } from "../../repositories/publisherPrivilegeRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { userRepository } from "../../repositories/userRepository"
import { weekendScheduleRepository } from "../../repositories/weekendScheduleRepository"
import { mechanicalAssignmentRepository } from "../../repositories/mechanicalAssignmentRepository"
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { MechanicalRole, MechanicalRoleLabels } from "../../types/mechanical"
import { Privileges } from "../../types/privileges"
import { BodyPublisherCreateTypes, BodyPublisherUpdateTypes, ParamsGetPublisherTypes, ParamsGetPublishersTypes, ParamsGetPublishersWithCongregationNumberTypes, ParamsPublisherDeleteAndUpdateTypes, ParamsUnLinkPublisherToUserTypes } from "./types"

interface UnifiedAssignment {
  id?: string
  role: string
  date: string
  title?: string | null
  room?: string
  partner?: string
  status?: string
  eventType?: string
  fieldServiceLocation?: string
  fieldServiceHour?: string
  talk?: any
  group?: {
    id?: string
    name?: string
  },
  destinationCongregation?: {
    name?: string
    city?: string
    address?: string
    latitude?: number | string
    longitude?: number | string
    dayMeetingPublic?: any
    hourMeetingPublic?: string
  }
  publishers?: {
    id: string
    name: string
  }[]
  start_time?: string
  end_time?: string
  section?: string
  timeMinutes?: number
  partType?: string
  mechanicalRole?: string
  mechanicalRoleLabel?: string
  meetingType?: string
  order?: number
}

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
    const hasPioneerPrivilege =
      privileges?.includes(Privileges.PIONEIROREGULAR) ||
      privileges?.includes(Privileges.PIONEIROAUXILIAR) ||
      privileges?.includes(Privileges.AUXILIARINDETERMINADO)
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
    if (privileges && !hasPioneerPrivilege) {
      publisher.startPioneer = null
    } else {
      publisher.startPioneer =
        startPioneer !== undefined
          ? startPioneer
          : publisher.startPioneer
    }
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
      }, relations: ['group', 'congregation', "emergencyContact", "hospitalityGroup"]
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

  async getAssignmentPublisher(req: ParamsCustomRequest<ParamsGetPublisherTypes>, res: Response) {
    const { publisher_id } = req.params

    const publisher = await publisherRepository.findOne({
      where: {
        id: publisher_id
      },
      relations: ["congregation"]
    })

    if (!publisher) {
      throw new BadRequestError(messageErrors.notFound.publisher)
    }

    const assignmentsMeeting = await weekendScheduleRepository.find({
      where: [
        { chairman: { id: publisher_id }, date: MoreThanOrEqual(dayjs().format("YYYY-MM-DD")) },
        { reader: { id: publisher_id }, date: MoreThanOrEqual(dayjs().format("YYYY-MM-DD")) },
        { speaker: { publisher: { id: publisher_id } }, date: MoreThanOrEqual(dayjs().format("YYYY-MM-DD")) },
      ],
      relations: ["chairman", "reader", "speaker", "speaker.publisher", "talk", "congregation"],
      order: { date: "ASC" }
    })

    const cleaningSchedules = await cleaningScheduleRepository.find({
      where: {
        date: MoreThanOrEqual(dayjs().format("YYYY-MM-DD")),
        group: {
          publishers: {
            id: publisher_id
          }
        }
      },
      relations: [
        "group",
        "group.publishers"
      ],
      order: {
        date: "ASC"
      }
    });

    const publicWitnessAssignments =
      await publicWitnessAssignmentRepository
        .createQueryBuilder("pw")
        .innerJoin("pw.publishers", "pp")
        .innerJoin("pp.publisher", "publisherFilter")
        .leftJoinAndSelect("pw.publishers", "allPublishers")
        .leftJoinAndSelect("allPublishers.publisher", "publisher")
        .leftJoinAndSelect("pw.timeSlot", "timeSlot")
        .leftJoinAndSelect("timeSlot.arrangement", "arrangement")
        .where("publisherFilter.id = :publisher_id", { publisher_id })
        .andWhere("pw.date >= :today", {
          today: dayjs().format("YYYY-MM-DD")
        })
        .orderBy("pw.date", "ASC")
        .getMany()


    const hospitality = await hospitalityAssignmentRepository.find({
      where: {
        weekend: {
          date: MoreThanOrEqual(dayjs().format("YYYY-MM-DD"))
        }
      },
      relations: ['group', 'group.members', 'group.host', 'weekend']
    })

    const externalTalks = await externalTalkRepository.find({
      where: {
        speaker: {
          publisher: {
            id: publisher_id
          }
        },
        date: MoreThanOrEqual(dayjs().format("YYYY-MM-DD"))
      },
      relations: ['destinationCongregation', 'talk']
    })

    const fieldServiceRotationAssignments =
      await fieldServiceScheduleRepository.find({
        where: {
          leader: { id: publisher_id },
          date: MoreThanOrEqual(dayjs().format("YYYY-MM-DD")),
        },
        order: {
          date: "ASC",
        },
        relations: ["template", "leader"],
      })


    const filteredHospitality = hospitality.filter(h =>
      // Verifica se o publisher é host OU membro do grupo
      h.group?.host?.id === publisher_id ||
      h.group?.members?.some(member => member.id === publisher_id)
    )

    const publicWitnessMapped: UnifiedAssignment[] =
      publicWitnessAssignments.map(pw => ({
        role: "Testemunho Público",
        date: pw.date,
        title: pw.timeSlot.arrangement.title,
        start_time: pw.timeSlot.start_time,
        end_time: pw.timeSlot.end_time,
        publishers: pw.publishers.map(p => ({
          id: p.publisher.id,
          name: p.publisher.nickname ?? p.publisher.fullName ?? "-"
        }))
      }))


    // 4️⃣ Mapeia as designações de hospitalidade
    const hospitalityAssignments = filteredHospitality.map((h) => ({
      role: h.group?.host?.id === publisher_id ? "Anfitrião" : "Hospitalidade",
      eventType: h.eventType,
      date: h.weekend.date,
      group: {
        id: h.group?.id,
        name: h.group?.name,
      },
    }))

    const assignments = assignmentsMeeting.map((s) => {
      const pubCongId = publisher.congregation?.id;
      const sCongId = s.congregation?.id;
      if (s.chairman?.id === publisher_id && sCongId && pubCongId && sCongId === pubCongId) {
        return {
          role: "Presidente",
          date: s.date,
        }
      }
      if (s.reader?.id === publisher_id && sCongId && pubCongId && sCongId === pubCongId) {
        return {
          role: "Leitor",
          date: s.date,
        }
      }
      if (s.speaker?.publisher?.id === publisher_id) {
        return {
          role: "Orador",
          date: s.date,
          destinationCongregation: s.congregation,
          talk: s.talk ? { number: s.talk.number, title: s.talk.title } : null,
        }
      }

      return undefined
    }).filter(Boolean)

    // 🔹 Mapeia designações de limpeza
    const cleaningAssignments = cleaningSchedules.map((c) => ({
      role: "Limpeza do Salão",
      date: c.date
    }));

    const fieldServiceRotationMapped: UnifiedAssignment[] =
      fieldServiceRotationAssignments.map(fs => ({
        role: "Dirigente de Campo",
        date: fs.date,
        fieldServiceHour: fs.template.time,
        fieldServiceLocation: fs.template.location,
      }))

    // 🔹 Mapeia designações externas
    const externalAssignments = externalTalks.map(e => ({
      role: "Discurso Externo",
      date: e.date,
      status: e.status,
      talk: e.talk ? e.talk : e.manualTalk,
      destinationCongregation: e.destinationCongregation ? {
        name: e.destinationCongregation?.name,
        city: e.destinationCongregation?.city,
        address: e.destinationCongregation?.address,
        latitude: e.destinationCongregation?.latitude,
        longitude: e.destinationCongregation?.longitude,
        dayMeetingPublic: e.destinationCongregation?.dayMeetingPublic,
        hourMeetingPublic: e.destinationCongregation?.hourMeetingPublic,
      } : null,
    }))

    // 🔹 Mapeia designações da Reunião de Meio de Semana (Funções Gerais)
    const todayStr = dayjs().format("YYYY-MM-DD")

    const getMidweekMeetingDate = (weekDate: string, explicitMeetingDate?: string | null, cong?: any | null) => {
      if (explicitMeetingDate && explicitMeetingDate !== weekDate) {
        return explicitMeetingDate;
      }
      const congMeetingDay = cong?.dayMeetingLifeAndMinistary || publisher.congregation?.dayMeetingLifeAndMinistary;
      if (congMeetingDay) {
        const isoDay = convertMeetingDayPortugueseToIso(congMeetingDay);
        return dayjs(weekDate).add(isoDay - 1, "day").format("YYYY-MM-DD");
      }
      return explicitMeetingDate || weekDate;
    };

    const midweekSchedules = await midweekScheduleRepository.find({
      where: [
        { chairman_id: publisher_id, meetingDate: MoreThanOrEqual(todayStr) },
        { chairman_id: publisher_id, weekDate: MoreThanOrEqual(todayStr) },
        { opening_prayer_id: publisher_id, meetingDate: MoreThanOrEqual(todayStr) },
        { opening_prayer_id: publisher_id, weekDate: MoreThanOrEqual(todayStr) },
        { closing_prayer_id: publisher_id, meetingDate: MoreThanOrEqual(todayStr) },
        { closing_prayer_id: publisher_id, weekDate: MoreThanOrEqual(todayStr) },
        { aux_counselor_1_id: publisher_id, meetingDate: MoreThanOrEqual(todayStr) },
        { aux_counselor_1_id: publisher_id, weekDate: MoreThanOrEqual(todayStr) },
        { aux_counselor_2_id: publisher_id, meetingDate: MoreThanOrEqual(todayStr) },
        { aux_counselor_2_id: publisher_id, weekDate: MoreThanOrEqual(todayStr) },
        { cbs_conductor_id: publisher_id, meetingDate: MoreThanOrEqual(todayStr) },
        { cbs_conductor_id: publisher_id, weekDate: MoreThanOrEqual(todayStr) },
        { cbs_reader_id: publisher_id, meetingDate: MoreThanOrEqual(todayStr) },
        { cbs_reader_id: publisher_id, weekDate: MoreThanOrEqual(todayStr) },
      ],
      relations: ["congregation"],
      order: { meetingDate: "ASC" }
    })

    const midweekGeneralAssignments: UnifiedAssignment[] = []
    const uniqueMidweekSchedules = Array.from(new Map(midweekSchedules.map(s => [s.id, s])).values())

    for (const s of uniqueMidweekSchedules) {
      if (s.isSpecial && s.specialType !== "NONE" && s.specialType !== "CIRCUIT_OVERSEER_VISIT") {
        continue
      }
      const schedDate = getMidweekMeetingDate(s.weekDate, s.meetingDate, s.congregation);
      if (schedDate < todayStr) continue

      if (s.chairman_id === publisher_id) {
        midweekGeneralAssignments.push({
          role: "Presidente",
          title: "Reunião de Meio de Semana",
          date: schedDate
        })
      }
      if (s.opening_prayer_id === publisher_id) {
        midweekGeneralAssignments.push({
          role: "Oração Inicial",
          title: "Reunião de Meio de Semana",
          date: schedDate
        })
      }
      if (s.closing_prayer_id === publisher_id) {
        midweekGeneralAssignments.push({
          role: "Oração Final",
          title: "Reunião de Meio de Semana",
          date: schedDate
        })
      }
      if (s.aux_counselor_1_id === publisher_id) {
        midweekGeneralAssignments.push({
          role: "Conselheiro",
          title: "Sala Auxiliar 1",
          room: "Sala Auxiliar 1",
          date: schedDate
        })
      }
      if (s.aux_counselor_2_id === publisher_id) {
        midweekGeneralAssignments.push({
          role: "Conselheiro",
          title: "Sala Auxiliar 2",
          room: "Sala Auxiliar 2",
          date: schedDate
        })
      }
      if (s.cbs_conductor_id === publisher_id) {
        midweekGeneralAssignments.push({
          role: "Dirigente do Estudo Bíblico",
          title: "Estudo Bíblico de Congregação",
          date: schedDate
        })
      }
      if (s.cbs_reader_id === publisher_id) {
        midweekGeneralAssignments.push({
          role: "Leitor do Estudo Bíblico",
          title: "Estudo Bíblico de Congregação",
          date: schedDate
        })
      }
    }

    // 🔹 Mapeia partes de estudantes e discursos do Meio de Semana
    const midweekParts = await midweekMeetingPartRepository.find({
      where: [
        { assigned_publisher_id: publisher_id, isActive: true },
        { assistant_publisher_id: publisher_id, isActive: true }
      ],
      relations: [
        "schedule",
        "schedule.congregation",
        "assignedPublisher",
        "assistantPublisher"
      ]
    })

    const midweekPartAssignments: UnifiedAssignment[] = []
    for (const part of midweekParts) {
      if (!part.schedule) continue
      if (part.schedule.isSpecial && part.schedule.specialType !== "NONE" && part.schedule.specialType !== "CIRCUIT_OVERSEER_VISIT") {
        continue
      }
      const partDate = getMidweekMeetingDate(part.schedule.weekDate, part.schedule.meetingDate, part.schedule.congregation);
      if (partDate < todayStr) continue

      const roomName = part.room === "AUXILIARY_1" ? "Sala Auxiliar 1" : part.room === "AUXILIARY_2" ? "Sala Auxiliar 2" : "Sala Principal"

      if (part.assigned_publisher_id === publisher_id) {
        const asstName = part.assistantPublisher?.nickname || part.assistantPublisher?.fullName
        midweekPartAssignments.push({
          role: "Meio de Semana",
          title: part.title,
          room: roomName,
          partner: asstName || undefined,
          date: partDate,
          section: part.section,
          timeMinutes: part.timeMinutes,
          partType: part.partType
        })
      }

      if (part.assistant_publisher_id === publisher_id) {
        const studentName = part.assignedPublisher?.nickname || part.assignedPublisher?.fullName
        midweekPartAssignments.push({
          role: "Ajudante (Meio de Semana)",
          title: part.title,
          room: roomName,
          partner: studentName || undefined,
          date: partDate,
          section: part.section,
          timeMinutes: part.timeMinutes,
          partType: part.partType
        })
      }
    }

    // 🔹 Mapeia designações de partes mecânicas
    const mechanicalAssignmentsQuery = mechanicalAssignmentRepository
      .createQueryBuilder("ma")
      .innerJoinAndSelect("ma.schedule", "sched")
      .where("ma.publisher_id = :publisher_id", { publisher_id })
      .andWhere("sched.date >= :todayStr", { todayStr })

    if (publisher.congregation?.id) {
      mechanicalAssignmentsQuery.andWhere("sched.congregation_id = :congregation_id", {
        congregation_id: publisher.congregation.id
      })
    }

    const mechanicalAssignments = await mechanicalAssignmentsQuery
      .orderBy("sched.date", "ASC")
      .addOrderBy("ma.order", "ASC")
      .getMany()

    const mechanicalAssignmentsMapped: UnifiedAssignment[] = mechanicalAssignments
      .filter(ma => ma.schedule && !ma.schedule.hasNoMeeting)
      .map(ma => {
        const roleLabel = MechanicalRoleLabels[ma.role] || ma.role
        const roleWithOrder =
          ma.order && ma.order > 1 && (ma.role === MechanicalRole.ATTENDANT || ma.role === MechanicalRole.ROVING_MIC || ma.role === MechanicalRole.STAGE_MIC)
            ? `${roleLabel} ${ma.order}`
            : roleLabel

        return {
          id: ma.id,
          role: "Tarefa Mecânica",
          title: roleWithOrder,
          mechanicalRole: ma.role,
          mechanicalRoleLabel: roleLabel,
          order: ma.order,
          meetingType: ma.schedule.meetingType,
          date: ma.schedule.date
        }
      })

    const allAssignments: UnifiedAssignment[] = [
      ...assignments as UnifiedAssignment[],
      ...hospitalityAssignments as UnifiedAssignment[],
      ...externalAssignments as UnifiedAssignment[],
      ...cleaningAssignments as UnifiedAssignment[],
      ...fieldServiceRotationMapped as UnifiedAssignment[],
      ...publicWitnessMapped,
      ...midweekGeneralAssignments,
      ...midweekPartAssignments,
      ...mechanicalAssignmentsMapped
    ]

    // 🔹 Ordena por data
    allAssignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return res.status(200).json(allAssignments)
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

  async transferPublishers(
    req: CustomRequestPT<{}, { publisherIds: string[]; newCongregationId: string }>,
    res: Response
  ) {
    const { publisherIds, newCongregationId } = req.body

    if (!Array.isArray(publisherIds) || publisherIds.length === 0) {
      throw new BadRequestError("You must send at least one publisherId")
    }

    if (!newCongregationId) {
      throw new BadRequestError("New congregation is required")
    }

    const newCongregation = await congregationRepository.findOne({
      where: {
        id: newCongregationId,
        type: CongregationType.SYSTEM,
      },
    })

    if (!newCongregation) {
      throw new BadRequestError("New congregation does not exist or is not type SYSTEM")
    }

    const results: any[] = []

    await publisherRepository.manager.transaction(async (manager) => {
      const txPublisherRepo = manager.getRepository(Publisher)
      const txSpeakerRepo = manager.getRepository(Speaker)
      const txGroupOverseersRepo = manager.getRepository(GroupOverseers)
      const txHospitalityGroupRepo = manager.getRepository(HospitalityGroup)
      const txUserRepo = manager.getRepository(User)

      for (const publisher_id of publisherIds) {
        const txPublisher = await txPublisherRepo.findOne({
          where: { id: publisher_id },
          relations: [
            "group",
            "hospitalityGroup",
            "user",
            "emergencyContact",
            "congregation",
          ],
        })

        if (!txPublisher) {
          results.push({
            publisherId: publisher_id,
            status: "not_found",
          })
          continue
        }

        // Já pertence à mesma congregação
        if (txPublisher.congregation?.id === newCongregationId) {
          results.push({
            publisherId: publisher_id,
            status: "already_in_congregation",
          })
          continue
        }

        // === LIMPEZA DAS RELAÇÕES ===

        // 1 — Grupo
        txPublisher.group = null

        // 2 — Hospitality Group como host
        const hostGroups = await txHospitalityGroupRepo.find({
          where: { host: { id: txPublisher.id } },
        })

        for (const hg of hostGroups) {
          hg.host = null
          await txHospitalityGroupRepo.save(hg)
        }

        if (txPublisher.hospitality_group_id) {
          txPublisher.hospitality_group_id = null
        }
        txPublisher.hospitalityGroup = null

        // 3 — Emergency contact
        if (txPublisher.emergencyContact) {
          txPublisher.emergencyContact = null
        }

        // 4 — Remove group overseers
        const overseersDeleted = await txGroupOverseersRepo.delete({
          publisher: { id: txPublisher.id } as any,
        })

        // 5 — Update user congregation
        let userUpdated = false
        if (txPublisher.user) {
          const txUser = await txUserRepo.findOne({
            where: { id: txPublisher.user.id },
          })
          if (txUser) {
            txUser.congregation = { id: newCongregationId } as any
            await txUserRepo.save(txUser)
            userUpdated = true
          }
        }

        // 6 — Speakers
        const speakers = await txSpeakerRepo.find({
          where: { publisher: { id: txPublisher.id } },
        })

        let speakerUpdatedCount = 0
        for (const sp of speakers) {
          sp.originCongregation = { id: newCongregationId } as any
          sp.publisher = null
          await txSpeakerRepo.save(sp)
          speakerUpdatedCount++
        }

        // 7 — Define nova congregation
        txPublisher.congregation = { id: newCongregationId } as any
        txPublisher.groupOverseers = null

        await txPublisherRepo.save(txPublisher)

        results.push({
          publisherId: txPublisher.id,
          status: "transferred",
          overseersRemoved: overseersDeleted.affected ?? 0,
          userUpdated,
          speakersUpdated: speakerUpdatedCount,
        })
      }
    })

    return res.json({
      message: "Publishers processed.",
      results,
    })
  }
}

export default new PublisherControler()