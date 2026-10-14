import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { messageErrors } from "../../helpers/messageErrors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { publisherRepository } from "../../repositories/publisherRepository";
import { cleaningGroupRepository } from "../../repositories/cleaningGroupRepository";
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";
import {
  ParamsCleaningGroupCreate,
  BodyCleaningGroupCreate,
  ParamsCleaningGroupUpdate,
  BodyCleaningGroupUpdate,
  ParamsGetCleaningGroups,
  ParamsDeleteCleaningGroup,
  ParamsGetCleaningGroup
} from "./types";
import { In, Not } from "typeorm";
import { Publisher } from "../../entities/Publisher";
import { cleaningScheduleRepository } from "../../repositories/cleaningScheduleRepository";
import { hasPrivilege } from "../../helpers/publisherPrivilegeHelper";
import { PrivilegeCode } from "../../types/privileges";

class CleaningGroupController {
  async create(
    req: CustomRequestPT<ParamsCleaningGroupCreate, BodyCleaningGroupCreate>,
    res: Response
  ) {
    const { congregation_id } = req.params;
    const { name, publisherIds, order } = req.body;

    if (!order || order <= 0)
      throw new BadRequestError("Order must be a positive integer");

    const congregation = await congregationRepository.findOneBy({ id: congregation_id });
    if (!congregation)
      throw new BadRequestError(messageErrors.notFound.congregation);

    const existingGroups = await cleaningGroupRepository.find({
      where: { congregation: { id: congregation.id } },
      order: { order: "ASC" }
    });

    if (existingGroups.some(g => g.name === name)) {
      throw new BadRequestError("Cleaning group already exists in this congregation");
    }

    // Valida conflito de ordem
    if (existingGroups.some(g => g.order === order)) {
      throw new BadRequestError("Another group already has this order");
    }

    await cleaningGroupRepository.save(existingGroups);

    let publishers: Publisher[] = [];


    if (publisherIds?.length) {
      // Busca todos os grupos da congregação com seus publishers
      const allGroups = await cleaningGroupRepository.find({
        where: { congregation: { id: congregation.id } },
        relations: ["publishers"]
      });

      // Checa se algum dos publishers já está em outro grupo
      const conflict = allGroups.some(group =>
        group.publishers.some(p => publisherIds.includes(p.id))
      );

      if (conflict) {
        throw new BadRequestError("One or more publishers are already assigned to another group");
      }

      // Se não tem conflito, busca os publishers de fato
      const rawPublishers = await publisherRepository.find({
        where: { id: In(publisherIds), congregation: { id: congregation.id } },
        relations: ["privilegesRelation", "privilegesRelation.privilege"]
      });
      publishers = rawPublishers.filter(p => hasPrivilege(p, PrivilegeCode.PUBLISHER));
    }

    const newGroup = cleaningGroupRepository.create({
      name,
      order,
      congregation,
      publishers
    });

    await cleaningGroupRepository.save(newGroup);
    return res.status(201).json(newGroup);
  }


  async update(
    req: CustomRequestPT<ParamsCleaningGroupUpdate, BodyCleaningGroupUpdate>,
    res: Response
  ) {
    const { group_id: id } = req.params;
    const { name, publisherIds } = req.body;

    const group = await cleaningGroupRepository.findOne({
      where: { id },
      relations: ["publishers", "congregation"]
    });

    if (!group) {
      throw new NotFoundError("Cleaning group not found");
    }

    if (Array.isArray(publisherIds)) {
      const congregationId = group.congregation?.id;
      if (!congregationId)
        throw new BadRequestError(messageErrors.notFound.congregation);

      // Busca todos os grupos da congregação com seus publishers, exceto o grupo que está sendo editado
      const allGroups = await cleaningGroupRepository.find({
        where: { congregation: { id: congregationId }, id: Not(id) },
        relations: ["publishers"]
      });

      const conflict = allGroups.some(g =>
        g.publishers.some(p => publisherIds.includes(p.id))
      );

      if (conflict) {
        throw new BadRequestError("One or more publishers are already assigned to another group");
      }

      // Busca os publishers válidos
      const rawPublishers = publisherIds.length
        ? await publisherRepository.find({
          where: { id: In(publisherIds), congregation: { id: congregationId } },
          relations: ["privilegesRelation", "privilegesRelation.privilege"]
        })
        : [];

      group.publishers = rawPublishers.filter(p => hasPrivilege(p, PrivilegeCode.PUBLISHER));
    }

    if (name) group.name = name;

    await cleaningGroupRepository.save(group);
    return res.status(200).json(group);
  }

  async delete(req: ParamsCustomRequest<ParamsDeleteCleaningGroup>, res: Response) {
    const { group_id } = req.params;

    const group = await cleaningGroupRepository.findOne({
      where: { id: group_id },
      relations: ["congregation"]
    });

    if (!group) throw new NotFoundError("Cleaning group not found");

    // 🔹 Remove todos os schedules relacionados ao grupo
    const schedules = await cleaningScheduleRepository.find({
      where: { group: { id: group_id } }
    });

    if (schedules.length > 0) {
      await cleaningScheduleRepository.remove(schedules);
    }

    // 🔹 Agora sim pode remover o grupo
    await cleaningGroupRepository.remove(group);

    // 🔄 Reorganiza ordens após remover
    const groups = await cleaningGroupRepository.find({
      where: { congregation: { id: group.congregation.id } },
      order: { order: "ASC" }
    });

    groups.forEach((g, index) => {
      g.order = index + 1;
    });

    await cleaningGroupRepository.save(groups);

    return res.status(200).end();
  }



  async getGroup(req: ParamsCustomRequest<ParamsGetCleaningGroup>, res: Response) {
    const { group_id: id } = req.params;

    const group = await cleaningGroupRepository.findOne({
      where: { id },
      relations: ["publishers", "publishers.privilegesRelation", "publishers.privilegesRelation.privilege"]
    });
    if (!group) throw new NotFoundError("Cleaning group not found");

    if (group.publishers) {
      group.publishers = group.publishers.filter(p => hasPrivilege(p, PrivilegeCode.PUBLISHER));
    }

    return res.status(200).json(group);
  }


  async getGroups(req: ParamsCustomRequest<ParamsGetCleaningGroups>, res: Response) {
    const { congregation_id } = req.params;

    const congregation = await congregationRepository.findOneBy({ id: congregation_id });
    if (!congregation)
      throw new NotFoundError(messageErrors.notFound.congregation);

    const groups = await cleaningGroupRepository.find({
      where: { congregation: { id: congregation.id } },
      relations: ["publishers", "publishers.privilegesRelation", "publishers.privilegesRelation.privilege"],
      order: { order: "ASC" }
    });

    for (const g of groups) {
      if (g.publishers) {
        g.publishers = g.publishers.filter(p => hasPrivilege(p, PrivilegeCode.PUBLISHER));
      }
    }

    return res.status(200).json(groups);
  }
}

export default new CleaningGroupController();
