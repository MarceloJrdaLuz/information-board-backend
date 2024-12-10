import { Response } from "express"
import { BodyTerritoryCreateTypes, BodyTerritoryUpdateTypes, ParamsTerritoryCreateTypes, ParamsTerritoryDeleteTypes, ParamsTerritoryUpdateTypes } from "./types"
import { CustomRequestPT, ParamsCustomRequest } from "../../types/customRequest"
import { congregationRepository } from "../../repositories/congregationRepository"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { config } from "../../config"
import fs from 'fs-extra'
import { deleteFirebase, firebaseUpload } from "../../provider/firebaseStorage"
import { NormalizeFiles } from "../../types/normalizeFile"
import { territoryRepository } from "../../repositories/territoryRepository"
import path from "path"
import { messageErrors } from "../../helpers/messageErrors"

class TerritoryController {
    async create(req: CustomRequestPT<ParamsTerritoryCreateTypes, BodyTerritoryCreateTypes>, res: Response) {
        const { congregation_id } = req.params
        const { name, description } = req.body
        const file = req.file

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!congregation) {
            throw new BadRequestError(messageErrors.notFound.congregation)
        }

        const territoryAlreadyExist = await territoryRepository.findOne({
            where: {
                name,
                congregation: {
                    id: congregation.id
                }
            }
        })

        if (territoryAlreadyExist) {
            throw new BadRequestError('Territory duplicated in this congregation')
        }

        if (file) {
            switch (config.storage_type) {
                case 'local':
                    fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/territories/${req.file?.filename}`, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    console.log('moved')
                    saveBD(null)
                    break
                case 'firebase':
                    await firebaseUpload(req, res, `territories/${congregation.number}`, saveBD)
                    break
                default:
                    res.send('Storage local type is not defined at .env')
                    break
            }
        } else saveBD(null)

        async function saveBD(file: NormalizeFiles | null) {
            if (congregation) {
                const newTerritory = territoryRepository.create({
                    name,
                    description,
                    image_url: file?.url ?? "",
                    key: file?.key ?? "",
                    congregation
                })

                await territoryRepository.save(newTerritory).then(async () => {
                    await territoryRepository.save(newTerritory)
                    return res.status(201).json(newTerritory)
                }).catch(err => {
                    console.log(err)
                    return res.status(500).send({ message: 'Internal server error, checks the logs' })
                })
            }
        }
    }

    async update(req: CustomRequestPT<ParamsTerritoryUpdateTypes, BodyTerritoryUpdateTypes>, res: Response) {
        const { territory_id: id } = req.params
        const { description, name } = req.body

        const file = req.file as Express.Multer.File

        const territory = await territoryRepository.findOneBy({ id })

        if (!territory) {
            throw new NotFoundError(messageErrors.notFound.territory)
        }

        if (file) {
            switch (config.storage_type) {
                case 'local':
                    fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/territories/${req.file?.filename}`, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    console.log('Moved')
                    saveBD(null)
                    break
                case 'firebase':
                    await firebaseUpload(req, res, `territories`, saveBD)
                    break
                default:
                    res.send('Storage local type is not defined at .env')
                    break
            }
        } else saveBD(null)

        async function saveBD(file: NormalizeFiles | null) {
            if (file) {
                if (territory?.key) await deleteFirebase(territory?.key)
            }
            const updateTerritory = {
                name,
                description,
                image_url: file?.url ?? territory?.image_url,
                key: file?.key ?? territory?.key
            }

            await territoryRepository.save({ id, ...updateTerritory }).then(suc => {
                return res.status(201).json(suc)
            }).catch(err => {
                console.log(err)
                return res.status(500).json({ message: 'Internal server error' })
            })
        }
    }

    async delete(req: ParamsCustomRequest<ParamsTerritoryDeleteTypes>, res: Response) {
        const { territory_id } = req.params

        const territory = await territoryRepository.findOneBy({ id: territory_id })

        if (!territory) {
            throw new NotFoundError(messageErrors.notFound.territory)
        }

        if (config.storage_type !== "local") {
            await deleteFirebase(territory.key)
        }

        await territoryRepository.remove(territory).catch(err => console.log(err))

        return res.status(200).end()
    }

    async getTerritories(req: ParamsCustomRequest<ParamsTerritoryCreateTypes>, res: Response) {
        const { congregation_id } = req.params

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!congregation) {
            throw new NotFoundError(messageErrors.notFound.congregation)
        }

        const territories = await territoryRepository.find({
            where: {
                congregation: {
                    id: congregation.id
                }
            }
        })
        res.send(territories)
    }
}

export default new TerritoryController()