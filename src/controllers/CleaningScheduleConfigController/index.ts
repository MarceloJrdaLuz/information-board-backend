import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { messageErrors } from "../../helpers/messageErrors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { cleaningScheduleConfigRepository } from "../../repositories/cleaningScheduleConfigRepository";
import {
  ParamsConfigCreate,
  BodyConfigCreate,
  ParamsConfigUpdate,
  BodyConfigUpdate,
  ParamsGetCongregationConfig
} from "./types";
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest";

class CleaningScheduleConfigController {

  // Criar configuração
  async create(
    req: CustomRequestPT<ParamsConfigCreate, BodyConfigCreate>,
    res: Response
  ) {
    const { congregation_id } = req.params;
    const { mode } = req.body;

    const congregation = await congregationRepository.findOneBy({ id: congregation_id });

    if (!congregation) {
      throw new BadRequestError(messageErrors.notFound.congregation);
    }

    const configExists = await cleaningScheduleConfigRepository.findOne({
      where: { congregation: { id: congregation.id } }
    });

    if (configExists) {
      throw new BadRequestError("Configuration already exists for this congregation");
    }

    const config = cleaningScheduleConfigRepository.create({
      congregation,
      mode,
    });

    await cleaningScheduleConfigRepository.save(config)
      .then(() => res.status(201).json(config))
      .catch(err => {
        console.log(err);
        res.status(500).send({ message: "Internal server error" });
      });
  }

  // Atualizar configuração
  async update(
    req: CustomRequestPT<ParamsConfigUpdate, BodyConfigUpdate>,
    res: Response
  ) {
    const { config_id: id } = req.params;
    const { mode } = req.body;

    const config = await cleaningScheduleConfigRepository.findOneBy({ id });

    if (!config) {
      throw new NotFoundError("Cleaning schedule configuration not found");
    }

    config.mode = mode ?? config.mode;

    await cleaningScheduleConfigRepository.save(config)
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
      });
  }

  // Buscar uma configuração específica
  async getOne(
    req: ParamsCustomRequest<{ config_id: string }>,
    res: Response
  ) {
    const { config_id: id } = req.params;

    const config = await cleaningScheduleConfigRepository.findOne({
      where: { id },
      relations: ["congregation"]
    });

    if (!config) {
      throw new NotFoundError("Cleaning schedule configuration not found");
    }

    return res.status(200).json(config);
  }

  // Buscar a configuração de uma congregação
  async getByCongregation(
    req: ParamsCustomRequest<ParamsGetCongregationConfig>,
    res: Response
  ) {
    const { congregation_id } = req.params;

    const congregation = await congregationRepository.findOneBy({ id: congregation_id });

    if (!congregation) {
      throw new NotFoundError(messageErrors.notFound.congregation);
    }

    const config = await cleaningScheduleConfigRepository.findOne({
      where: { congregation: { id: congregation.id } },
      relations: ["congregation"]
    });

    if (!config) {
      throw new NotFoundError("Configuration not found for this congregation");
    }

    return res.status(200).json(config);
  }

  // Deletar configuração
  async delete(req: ParamsCustomRequest<{ config_id: string }>, res: Response) {
    const { config_id } = req.params;

    const config = await cleaningScheduleConfigRepository.findOneBy({ id: config_id });

    if (!config) {
      throw new NotFoundError("Cleaning schedule configuration not found");
    }

    await cleaningScheduleConfigRepository.remove(config).catch(err => console.log(err));

    return res.status(200).end();
  }
}

export default new CleaningScheduleConfigController();
