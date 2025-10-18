import { Response } from "express-serve-static-core"
import moment from "moment"
import { MoreThanOrEqual } from "typeorm"
import { normalize } from "../../functions/normalize"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { messageErrors } from "../../helpers/messageErrors"
import { monthNames } from "../../helpers/months"
import { congregationRepository } from "../../repositories/congregationRepository"
import { externalTalkRepository } from "../../repositories/externalTalkRepository"
import { hospitalityAssignmentRepository } from "../../repositories/hospitalityAssignmentRepository"
import { publisherRepository } from "../../repositories/publisherRepository"
import { speakerRepository } from "../../repositories/speakerRepository"
import { talkRepository } from "../../repositories/talkRepository"
import { weekendScheduleRepository } from "../../repositories/weekendScheduleRepository"
import { CustomRequest, CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import {
  BodyWeekendScheduleCreateTypes,
  BodyWeekendScheduleUpdateTypes,
  ParamsGetWeekendScheduleTypes,
  ParamsWeekendScheduleCreateTypes,
  ParamsWeekendScheduleTypes
} from "./types"

class WeekendScheduleController {
  async create(req: CustomRequestPT<ParamsWeekendScheduleCreateTypes, BodyWeekendScheduleCreateTypes>, res: Response) {
    const { congregation_id } = req.params
    const { schedules } = req.body

    if (!schedules || schedules.length === 0) {
      throw new BadRequestError("Schedules array is required")
    }

    const schedulesToSave = []
    let groupIndex = 0

    for (const item of schedules) {
      const scheduleDate = moment(item.date).format("YYYY-MM-DD")

      const existing = await weekendScheduleRepository.findOne({
        where: { date: scheduleDate, congregation: { id: congregation_id } },
      })
      if (existing) throw new BadRequestError(`A schedule already exists for ${scheduleDate}`)

      // Busca relacionamentos em paralelo
      const [
        speaker,
        talk,
        chairman,
        reader,
        visitingCongregation
      ] = await Promise.all([
        item.speaker_id
          ? speakerRepository.findOne({
            where: { id: item.speaker_id },
            relations: ["originCongregation"],
          })
          : null,
        item.talk_id ? talkRepository.findOneBy({ id: item.talk_id }) : null,
        item.chairman_id ? publisherRepository.findOneBy({ id: item.chairman_id }) : null,
        item.reader_id ? publisherRepository.findOneBy({ id: item.reader_id }) : null,
        item.visitingCongregation_id
          ? congregationRepository.findOneBy({ id: item.visitingCongregation_id })
          : null,
      ])


      if (item.speaker_id && !speaker) throw new NotFoundError(`Speaker ${item.speaker_id} not found`)
      if (speaker && visitingCongregation && speaker.originCongregation.id !== visitingCongregation.id) {
        throw new BadRequestError(
          `Speaker ${speaker.fullName} does not belong to the visiting congregation ${visitingCongregation.name}`
        )
      }

      if (item.talk_id && !talk) throw new NotFoundError(`Talk ${item.talk_id} not found`)
      if (item.chairman_id && !chairman) throw new NotFoundError(`Chairman ${item.chairman_id} not found`)
      if (item.reader_id && !reader) throw new NotFoundError(`Reader ${item.reader_id} not found`)

      const newSchedule = weekendScheduleRepository.create({
        date: scheduleDate,
        speaker,
        visitingCongregation,
        talk,
        chairman,
        reader,
        watchTowerStudyTitle: item.watchTowerStudyTitle ?? null,
        congregation: { id: congregation_id },
        isSpecial: item.isSpecial ?? false,
        specialName: item.specialName ?? null,
        manualSpeaker: item.manualSpeaker ?? null,
        manualTalk: item.manualTalk ?? null,
      })

      schedulesToSave.push(newSchedule)
    }

    const savedSchedules = await weekendScheduleRepository.save(schedulesToSave)
    return res.status(201).json(savedSchedules)
  }

  async update(req: CustomRequest<BodyWeekendScheduleUpdateTypes>, res: Response) {
    const { schedules } = req.body
    if (!schedules || schedules.length === 0) throw new BadRequestError("Schedules array is required")

    const schedulesToSave = []

    for (const item of schedules) {
      if (!item.id) throw new BadRequestError("Schedule ID is required for update")

      const schedule = await weekendScheduleRepository.findOne({
        where: { id: item.id },
        relations: ["speaker", "talk", "chairman", "reader", "hospitalityGroup", "congregation"]
      })
      if (!schedule) throw new NotFoundError(`WeekendSchedule ${item.id} not found`)

      if (item.date) {
        const newDate = moment(item.date).format("YYYY-MM-DD")
        const conflict = await weekendScheduleRepository.findOne({
          where: { date: newDate, congregation: { id: schedule.congregation.id } }
        })
        if (conflict && conflict.id !== schedule.id) throw new BadRequestError(`A schedule already exists for ${newDate}`)
        schedule.date = newDate
      }

      // Busca relacionamentos em paralelo
      const [
        speaker,
        talk,
        chairman,
        reader,
        visitingCongregation
      ] = await Promise.all([
        item.speaker_id
          ? speakerRepository.findOne({
            where: { id: item.speaker_id },
            relations: ["originCongregation"],
          })
          : null,
        item.talk_id ? talkRepository.findOneBy({ id: item.talk_id }) : null,
        item.chairman_id ? publisherRepository.findOneBy({ id: item.chairman_id }) : null,
        item.reader_id ? publisherRepository.findOneBy({ id: item.reader_id }) : null,
        item.visitingCongregation_id
          ? congregationRepository.findOneBy({ id: item.visitingCongregation_id })
          : null,
      ])


      if (item.speaker_id && !speaker) throw new NotFoundError(`Speaker ${item.speaker_id} not found`)

      if (speaker) {
        const visitingCong = visitingCongregation ?? schedule.visitingCongregation
        if (visitingCong && speaker.originCongregation.id !== visitingCong.id) {
          throw new BadRequestError(
            `Speaker ${speaker.fullName} does not belong to the visiting congregation ${visitingCong.name}`
          )
        }
      }
      if (item.talk_id && !talk) throw new NotFoundError(`Talk ${item.talk_id} not found`)
      if (item.chairman_id && !chairman) throw new NotFoundError(`Chairman ${item.chairman_id} not found`)
      if (item.reader_id && !reader) throw new NotFoundError(`Reader ${item.reader_id} not found`)

      schedule.speaker = speaker
      if (item.visitingCongregation_id !== undefined) {
        schedule.visitingCongregation = visitingCongregation
      }
      schedule.talk = talk
      schedule.chairman = chairman
      schedule.reader = reader
      schedule.watchTowerStudyTitle = item.watchTowerStudyTitle !== undefined ? item.watchTowerStudyTitle : schedule.watchTowerStudyTitle
      if (item.isSpecial !== undefined) {
        schedule.isSpecial = item.isSpecial
      }
      if (item.specialName !== undefined) {
        schedule.specialName = item.specialName
      }
      if (item.manualSpeaker !== undefined) {
        schedule.manualSpeaker = item.manualSpeaker
      }
      if (item.manualTalk !== undefined) {
        schedule.manualTalk = item.manualTalk
      }

      schedulesToSave.push(schedule)
    }

    const savedSchedules = await weekendScheduleRepository.save(schedulesToSave)
    return res.json(savedSchedules)
  }


  async delete(req: ParamsCustomRequest<ParamsWeekendScheduleTypes>, res: Response) {
    const { weekendSchedule_id } = req.params
    const schedule = await weekendScheduleRepository.findOneBy({ id: weekendSchedule_id })
    if (!schedule) throw new NotFoundError(messageErrors.notFound.weekendSchedule)

    await weekendScheduleRepository.remove(schedule)
    return res.status(200).end()
  }

  async getSchedules(req: ParamsCustomRequest<ParamsGetWeekendScheduleTypes>, res: Response) {
    const { congregation_id } = req.params
    const schedules = await weekendScheduleRepository.find({
      where: { congregation: { id: congregation_id } },
      relations: ["speaker", "talk", "chairman", "reader", "congregation", "visitingCongregation"],
      order: { date: "ASC" },
    })
    return res.json(schedules)
  }

  async getSchedule(req: ParamsCustomRequest<ParamsWeekendScheduleTypes>, res: Response) {
    const { weekendSchedule_id } = req.params
    const schedule = await weekendScheduleRepository.findOne({
      where: { id: weekendSchedule_id },
      relations: ["speaker", "talk", "chairman", "reader", "visitingCongregation"],
    })
    if (!schedule) throw new NotFoundError(messageErrors.notFound.weekendSchedule)

    return res.json(schedule)
  }

  async getPublicSchedules(req: ParamsCustomRequest<ParamsGetWeekendScheduleTypes>, res: Response) {
    const { congregation_id } = req.params
    const schedules = await weekendScheduleRepository.find({
      where: {
        congregation: {
          id: congregation_id
        },
        date: MoreThanOrEqual(moment().format("YYYY-MM-DD"))
      },
      relations: ["speaker", "talk", "chairman", "reader", "speaker.originCongregation", "visitingCongregation"],
      order: { date: "ASC" },
    })
    const externalTalks = await externalTalkRepository.find({
      where: {
        originCongregation: {
          id: congregation_id
        }
      },
      relations: ["speaker", "talk", "destinationCongregation"]
    })
    const hospitality = await hospitalityAssignmentRepository.find({
      where: {
        weekend: {
          congregation_id
        }
      },
      relations: ["weekend", "group", "group.host", "group.members"]
    })

    const today = moment()

    const mapped = schedules.map(s => {
      const date = moment(s.date, "YYYY-MM-DD")
      const month = monthNames[date.month()]
      const externals = externalTalks.filter(et => moment(et.date).isSame(date, "day"))
      const assignments = hospitality.filter(assign => moment(assign.weekend.date).isSame(date, "day"))
      return {
        id: s.id,
        date: s.date,
        month,
        isCurrentWeek: today.isSame(date, "week"),
        isSpecial: s.isSpecial,
        specialName: s.specialName,
        chairman: s.chairman ? { name: s.chairman.nickname ? s.chairman?.nickname : s.chairman.fullName } : null,
        reader: s.reader ? { name: s.reader.nickname ? s.reader.nickname : s.reader.fullName } : null,
        speaker: s.speaker
          ? {
            name: s.speaker.fullName,
            congregation: s.speaker.originCongregation
              ? normalize(s.speaker.originCongregation.city) === normalize(s.speaker.originCongregation.name)
                ? `${normalize(s.speaker.originCongregation.city)}`
                : `${normalize(s.speaker.originCongregation.name)} - ${normalize(s.speaker.originCongregation.city)}`
              : null,
          }
          : (s.manualSpeaker ? { name: s.manualSpeaker } : null),
        talk: s.talk
          ? { title: s.talk.title, number: s.talk.number }
          : (s.manualTalk ? { title: s.manualTalk } : null),
        watchTowerStudyTitle: s.watchTowerStudyTitle,
        externalTalks: externals.map(ext => ({
          id: ext.id,
          date: ext.date,
          speaker: ext.speaker ? { name: ext.speaker.fullName } : null,
          destinationCongregation: ext.destinationCongregation
            ? normalize(ext.destinationCongregation.city) === normalize(ext.destinationCongregation.name)
              ? `${normalize(ext.destinationCongregation.city)}`
              : `${normalize(ext.destinationCongregation.name)} - ${normalize(ext.destinationCongregation.city)}`
            : null,
          talk: ext.talk
            ? { title: ext.talk.title, number: ext.talk.number }
            : (ext.manualTalk ? { title: ext.manualTalk } : null),
        })),
        hospitality: assignments.map(assign => ({
          eventType: assign.eventType,
          completed: assign.completed,
          group: assign.group?.name,
          host: assign.group?.host?.nickname ? assign.group?.host?.nickname : assign.group?.host?.fullName,
          members: assign.group?.members.map(m => m.fullName) || []
        }))
      }
    })

    const grouped = mapped.reduce((acc, item) => {
      if (!acc[item.month]) acc[item.month] = []
      acc[item.month].push(item)
      return acc
    }, {} as Record<string, typeof mapped>)
    return res.json(grouped)
  }
}

export default new WeekendScheduleController()
