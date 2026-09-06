import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Between, In, LessThan } from "typeorm";
import { fieldServiceExceptionRepository } from "../../repositories/fieldServiceExceptionRepository";
import { fieldServiceRotationMemberRepository } from "../../repositories/fieldServiceRotationMembersRepository";
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository";
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository";
import { publisherUnavailabilityRepository } from "../../repositories/publisherUnavailabilityRepository";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface GenerateParams {
  template_id: string;
  startDate: string;
  endDate: string;
  mode?: "append" | "reconcile";
}

export async function generateFieldServiceSchedules({
  template_id,
  startDate,
  endDate,
  mode = "append",
}: GenerateParams) {
  /* ===============================
   * 1. Buscar template (UM SÓ)
   =============================== */
  const template = await fieldServiceTemplateRepository.findOne({
    where: { id: template_id },
    relations: ["congregation"],
  });

  if (!template) {
    throw new Error("Field service template not found");
  }

  /* ===============================
   * 2. Buscar rodízio
   =============================== */
  const rotation = await fieldServiceRotationMemberRepository.find({
    where: { template: { id: template.id } },
    relations: ["publisher"],
    order: { order: "ASC" },
  });

  if (!rotation.length) return;

  const publisherIds = rotation.map((r) => r.publisher_id);

  /* ===============================
   * 3. Buscar exceções do período
   =============================== */
  const exceptions = await fieldServiceExceptionRepository.find({
    where: { date: Between(startDate, endDate) },
    relations: ["template"],
  });

  const hasException = (date: string) =>
    exceptions.some(
      (e) =>
        e.date === date &&
        (!e.template || e.template.id === template.id)
    );

  /* ===============================
   * 4. Buscar indisponibilidades ativas no período
   =============================== */
  const unavailabilities = await publisherUnavailabilityRepository
    .createQueryBuilder("unav")
    .where("unav.publisher_id IN (:...publisherIds)", { publisherIds })
    .andWhere("unav.startDate <= :endDate AND unav.endDate >= :startDate", {
      startDate,
      endDate,
    })
    .getMany();

  const isPublisherUnavailable = (pubId: string, date: string): boolean => {
    return unavailabilities.some(
      (u) =>
        u.publisher_id === pubId &&
        dayjs(date).isSameOrAfter(dayjs(u.startDate), "day") &&
        dayjs(date).isSameOrBefore(dayjs(u.endDate), "day")
    );
  };

  /* ===============================
   * 5. Mapear histórico de designações de cada membro antes do período
   =============================== */
  const pastSchedules = await fieldServiceScheduleRepository.find({
    where: {
      leader: { id: In(publisherIds) },
      date: LessThan(startDate),
    },
    order: { date: "DESC" },
  });

  const lastAssignedDateMap = new Map<string, string>();
  for (const s of pastSchedules) {
    if (s.leader_id && !lastAssignedDateMap.has(s.leader_id)) {
      lastAssignedDateMap.set(s.leader_id, s.date);
    }
  }

  /* ===============================
   * 6. Datas APENAS do dia do template
   =============================== */
  const dates = getDatesByWeekday(
    startDate,
    endDate,
    template.weekday
  );

  /* ===============================
   * 7. Reconcile (opcional)
   =============================== */
  if (mode === "reconcile") {
    const existing = await fieldServiceScheduleRepository.find({
      where: {
        template: { id: template.id },
        date: Between(startDate, endDate),
      },
    });

    if (existing.length) {
      await fieldServiceScheduleRepository.remove(existing);
    }
  }

  /* ===============================
   * 8. Criar schedules com algoritmo inteligente
   =============================== */
  for (const date of dates) {
    if (hasException(date)) continue;

    const exists = await fieldServiceScheduleRepository.findOne({
      where: {
        template: { id: template.id },
        date,
      },
    });

    if (exists) {
      if (exists.leader_id) {
        lastAssignedDateMap.set(exists.leader_id, date);
      }
      continue;
    }

    // Filtrar membros do rodízio que NÃO estão indisponíveis na data
    const availableMembers = rotation.filter(
      (m) => !isPublisherUnavailable(m.publisher_id, date)
    );

    // Se todos estiverem indisponíveis na data, fallback para todos os membros do rodízio
    const candidates = availableMembers.length > 0 ? [...availableMembers] : [...rotation];

    // Ordenar membros disponíveis por:
    // 1. Mais tempo sem dirigir (quem nunca dirigiu primeiro, ou data mais antiga)
    // 2. Ordem de cadastro no rodízio como critério de desempate
    candidates.sort((a, b) => {
      const dateA = lastAssignedDateMap.get(a.publisher_id);
      const dateB = lastAssignedDateMap.get(b.publisher_id);

      // Quem nunca dirigiu (null/undefined) tem prioridade máxima
      if (!dateA && dateB) return -1;
      if (dateA && !dateB) return 1;

      // Ambos já dirigiram: quem dirigiu há mais tempo (menor timestamp) vem antes
      if (dateA && dateB) {
        const diff = dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
        if (diff !== 0) return diff;
      }

      // Desempate pela ordem cadastrada no rodízio
      return a.order - b.order;
    });

    const selectedMember = candidates[0];
    const leader = selectedMember.publisher;

    await fieldServiceScheduleRepository.save(
      fieldServiceScheduleRepository.create({
        template,
        template_id: template.id,
        date,
        leader,
        leader_id: leader.id,
      })
    );

    // Atualiza a data da última designação para as próximas semanas do período
    lastAssignedDateMap.set(selectedMember.publisher_id, date);
  }
}

/* =========================
   Helpers
========================= */

function getDatesByWeekday(
  start: string,
  end: string,
  weekday: number
): string[] {
  const dates: string[] = [];
  let current = dayjs(start);

  while (current.isSameOrBefore(end)) {
    if (current.day() === weekday) {
      dates.push(current.format("YYYY-MM-DD"));
    }
    current = current.add(1, "day");
  }

  return dates;
}
