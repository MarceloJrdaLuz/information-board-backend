import { Request, Response } from "express";
import { CleaningGroup } from "../../entities/CleaningGroup";
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
import { cleaningGroupUnavailabilityRepository } from "../../repositories/cleaningGroupUnavailabilityRepository";
import { hasPrivilege } from "../../helpers/publisherPrivilegeHelper";
import { PrivilegeCode } from "../../types/privileges";

class CleaningGroupController {
  async create(
    req: CustomRequestPT<ParamsCleaningGroupCreate, BodyCleaningGroupCreate>,
    res: Response
  ) {
    const { congregation_id } = req.params;
    let { name, publisherIds, order, dayPreference } = req.body;

    const congregation = await congregationRepository.findOneBy({ id: congregation_id });
    if (!congregation)
      throw new BadRequestError(messageErrors.notFound.congregation);

    const existingGroups = await cleaningGroupRepository.find({
      where: { congregation: { id: congregation.id } },
      order: { order: "ASC" }
    });

    // Se a ordem não foi fornecida, assume automaticamente o próximo número na sequência
    const finalOrder = (order && order > 0) ? order : (existingGroups.length + 1);

    // Valida conflito de ordem se o usuário tiver especificado explicitamente
    if (order && order > 0 && existingGroups.some(g => g.order === finalOrder)) {
      throw new BadRequestError("Another group already has this order");
    }

    const trimmedName = name?.trim();
    // Se o nome não foi informado ou está em branco, assume o padrão "Grupo {order}"
    const finalName = trimmedName || `Grupo ${finalOrder}`;

    // Só valida duplicidade se for um nome personalizado diferente de "Grupo X"
    const isCustomName = trimmedName && !/^grupo\s*\d+$/i.test(trimmedName);
    if (isCustomName && existingGroups.some(g => g.name?.trim().toLowerCase() === trimmedName.toLowerCase())) {
      throw new BadRequestError("Cleaning group already exists in this congregation");
    }

    let publishers: Publisher[] = [];

    if (publisherIds && publisherIds.length > 0) {
      const pIds = publisherIds;
      // Busca todos os grupos da congregação com seus publishers
      const allGroups = await cleaningGroupRepository.find({
        where: { congregation: { id: congregation.id } },
        relations: ["publishers"]
      });

      // Checa se algum dos publishers já está em outro grupo
      const conflict = allGroups.some(group =>
        group.publishers.some(p => pIds.includes(p.id))
      );

      if (conflict) {
        throw new BadRequestError("One or more publishers are already assigned to another group");
      }

      // Se não tem conflito, busca os publishers de fato
      const rawPublishers = await publisherRepository.find({
        where: { id: In(pIds), congregation: { id: congregation.id } },
        relations: ["privilegesRelation", "privilegesRelation.privilege"]
      });
      publishers = rawPublishers.filter(p => hasPrivilege(p, PrivilegeCode.PUBLISHER));
    }

    const newGroup = cleaningGroupRepository.create({
      name: finalName,
      order: finalOrder,
      dayPreference: dayPreference || "ALL",
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
    const id = req.params.group_id || (req.params as any).groupId;
    if (!id) {
      throw new BadRequestError("ID do grupo não informado");
    }
    const { name, publisherIds, dayPreference } = req.body;

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

    if (name !== undefined) {
      const trimmed = name?.trim();
      // Se enviado vazio ou em branco, restaura para o padrão "Grupo {order}"
      group.name = trimmed || `Grupo ${group.order}`;
    }
    if (dayPreference) group.dayPreference = dayPreference;

    await cleaningGroupRepository.save(group);
    return res.status(200).json(group);
  }

  async delete(req: ParamsCustomRequest<ParamsDeleteCleaningGroup>, res: Response) {
    const targetId = req.params.group_id || (req.params as any).groupId;

    if (!targetId) {
      throw new BadRequestError("ID do grupo não informado");
    }

    const group = await cleaningGroupRepository.findOne({
      where: { id: targetId },
      relations: ["congregation"]
    });

    if (!group) throw new NotFoundError("Cleaning group not found");

    const congregationId = group.congregation?.id;

    // 🔹 Remove todos os schedules relacionados ao grupo
    const schedules = await cleaningScheduleRepository.find({
      where: { group: { id: targetId } }
    });

    if (schedules.length > 0) {
      await cleaningScheduleRepository.remove(schedules);
    }

    // 🔹 Remove indisponibilidades do grupo
    const unavailabilities = await cleaningGroupUnavailabilityRepository.find({
      where: { group: { id: targetId } }
    });

    if (unavailabilities.length > 0) {
      await cleaningGroupUnavailabilityRepository.remove(unavailabilities);
    }

    // 🔹 Agora sim pode remover o grupo
    await cleaningGroupRepository.remove(group);

    // 🔄 Reorganiza ordens e nomes padrão após remover
    if (congregationId) {
      const groups = await cleaningGroupRepository.find({
        where: { congregation: { id: congregationId } },
        order: { order: "ASC" }
      });

      const updatedGroups: CleaningGroup[] = [];
      groups.forEach((g, index) => {
        const newOrder = index + 1;
        // Se o grupo usa o nome padrão "Grupo X" ou está sem nome, sincroniza o nome com a nova ordem!
        const isDefaultName = !g.name || /^grupo\s*\d+$/i.test(g.name.trim());
        let changed = false;

        if (g.order !== newOrder) {
          g.order = newOrder;
          changed = true;
        }
        if (isDefaultName && g.name !== `Grupo ${newOrder}`) {
          g.name = `Grupo ${newOrder}`;
          changed = true;
        }
        if (changed) {
          updatedGroups.push(g);
        }
      });

      if (updatedGroups.length > 0) {
        await cleaningGroupRepository.save(updatedGroups);
      }
    }

    return res.status(200).end();
  }

  async getGroup(req: ParamsCustomRequest<ParamsGetCleaningGroup>, res: Response) {
    const id = req.params.group_id || (req.params as any).groupId;
    if (!id) throw new BadRequestError("ID do grupo não informado");

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

  async reorderGroups(req: Request, res: Response) {
    const { congregation_id } = req.params;
    const { orderedGroupIds } = req.body as { orderedGroupIds: string[] };

    if (!orderedGroupIds || !Array.isArray(orderedGroupIds) || orderedGroupIds.length === 0) {
      throw new BadRequestError("A lista de grupos não pode estar vazia");
    }

    const groups = await cleaningGroupRepository.find({
      where: { congregation: { id: congregation_id } },
    });

    if (groups.length !== orderedGroupIds.length) {
      throw new BadRequestError("A quantidade de grupos enviada não corresponde aos grupos existentes");
    }

    const groupMap = new Map(groups.map(g => [g.id, g]));
    const updatedGroups: CleaningGroup[] = [];

    orderedGroupIds.forEach((id, index) => {
      const group = groupMap.get(id);
      if (!group) throw new NotFoundError(`Grupo ${id} não encontrado`);

      const newOrder = index + 1;
      const isDefaultName = !group.name || /^grupo\s*\d+$/i.test(group.name.trim());

      group.order = newOrder;
      if (isDefaultName) {
        group.name = `Grupo ${newOrder}`;
      }
      updatedGroups.push(group);
    });

    await cleaningGroupRepository.save(updatedGroups);
    return res.status(200).json(updatedGroups);
  }
}

export default new CleaningGroupController();
