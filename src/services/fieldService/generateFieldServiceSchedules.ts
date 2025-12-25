import dayjs from "dayjs";
import { Between } from "typeorm";
import { fieldServiceExceptionRepository } from "../../repositories/fieldServiceExceptionRepository";
import { fieldServiceRotationMemberRepository } from "../../repositories/fieldServiceRotationMembersRepository";
import { fieldServiceScheduleRepository } from "../../repositories/fieldServiceScheduleRepository";
import { fieldServiceTemplateRepository } from "../../repositories/fieldServiceTemplateRepository";

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
   * 4. Datas APENAS do dia do template
   =============================== */
  const dates = getDatesByWeekday(
    startDate,
    endDate,
    template.weekday
  );

  /* ===============================
   * 5. Reconcile (opcional)
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
   * 6. Criar schedules
   =============================== */
  let rotationIndex = 0;

  for (const date of dates) {
    if (hasException(date)) continue;

    const exists = await fieldServiceScheduleRepository.findOne({
      where: {
        template: { id: template.id },
        date,
      },
    });

    if (exists) continue;

    const leader = rotation[rotationIndex].publisher;

    await fieldServiceScheduleRepository.save(
      fieldServiceScheduleRepository.create({
        template,
        template_id: template.id,
        date,
        leader,
        leader_id: leader.id,
      })
    );

    rotationIndex = (rotationIndex + 1) % rotation.length;
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
