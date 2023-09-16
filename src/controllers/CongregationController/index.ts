import { Request, Response } from "express";
import { config } from "../../config";
import { ApiError, BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { BodyCongregationCreateTypes, BodyCongregationUpdateTypes, ParamsUpdateCongregationTypes, QueryCongregationDeleteTypes, QueryGetCongregationTypes } from "./type";
import fs from 'fs-extra'
import { deleteFirebase, firebaseUpload } from "../../provider/firebaseStorage";
import { NormalizeFiles } from "../../types/normalizeFile";
import { documentRepository } from "../../repositories/documentRepository";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest, QueryCustomRequest } from "../../types/customRequest";
import { groupRepository } from "../../repositories/groupRepository";
import { Congregation } from "../../entities/Congregation";
import { messageErrors } from "../../helpers/messageErrors";


class CongregationController {

    async create(req: CustomRequest<BodyCongregationCreateTypes>, res: Response) {
        const { name, number, city, image_url, circuit } = req.body

        const file = req.file as Express.Multer.File

        const congExists = await congregationRepository.findOneBy({ number })

        if (congExists) {
            throw new BadRequestError('Congregation already exists')
        }

        if (!file) {
            saveBD(null)
        }

        if (file) {
            switch (config.storage_type) {
                case 'local':
                    fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/image-home/${number}/${req.file?.filename}`, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    console.log('Moved')
                    saveBD(null)
                    break;
                case 'firebase':
                    await firebaseUpload(req, res, `image-home/${number}`, saveBD)
                    break;
                default:
                    res.send('Storage local type is not defined at .env')
                    break;
            }
        }

        async function saveBD(file: NormalizeFiles | null) {
            const newCongregation = congregationRepository.create({
                name,
                number,
                city,
                circuit,
                image_url: file?.url ?? "",
                imageKey: file?.key
            })

            await congregationRepository.save(newCongregation).then(() => {
                return res.status(201).send(newCongregation)
            }).catch(err => {
                console.log(err)
                return res.status(500).send({ message: 'Internal server error, checks the logs' })
            })
        }
    }

    async delete(req: QueryCustomRequest<QueryCongregationDeleteTypes>, res: Response) {
        const { id } = req.params

        const congregation = await congregationRepository.findOneBy({ id })

        if (!congregation) {
            throw new NotFoundError('Congregation not found')
        }

        await congregationRepository.remove(congregation)

        return res.status(200).end()
    }

    async list(req: Request, res: Response) {
        const congExists = await congregationRepository.find({})

        if (!congExists) {
            throw new NotFoundError('Congregations not found')
        }

        return res.status(200).json(congExists)
    }

    async update(req: CustomRequestPT<ParamsUpdateCongregationTypes, BodyCongregationUpdateTypes>, res: Response) {
        const {
            name,
            circuit,
            city,
            dayMeetingLifeAndMinistary,
            dayMeetingPublic,
            hourMeetingLifeAndMinistary,
            hourMeetingPublic
        } = req.body

        const { congregation_id } = req.params

        if (!congregation_id) new BadRequestError("Congregation Id does not provided")

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!congregation) new NotFoundError("Congregation does not exists")

        if (congregation) {

            if (
                congregation.name === name &&
                congregation.circuit === circuit &&
                congregation.city === city &&
                congregation.dayMeetingLifeAndMinistary === dayMeetingLifeAndMinistary &&
                congregation.hourMeetingLifeAndMinistary === `${hourMeetingLifeAndMinistary}:00` &&
                congregation.dayMeetingPublic === dayMeetingPublic &&
                congregation.hourMeetingPublic === `${hourMeetingPublic}:00`
            ) {
                throw new BadRequestError('Any changes found')
            }

            congregation.name = name ?? congregation?.name
            congregation.circuit = circuit ?? congregation?.circuit
            congregation.city = city ?? congregation?.city
            congregation.dayMeetingLifeAndMinistary = dayMeetingLifeAndMinistary ?? congregation?.dayMeetingLifeAndMinistary
            congregation.hourMeetingLifeAndMinistary = hourMeetingLifeAndMinistary ?? congregation?.hourMeetingLifeAndMinistary
            congregation.dayMeetingPublic = dayMeetingPublic ?? congregation?.dayMeetingPublic
            congregation.hourMeetingPublic = hourMeetingPublic ?? congregation?.hourMeetingPublic

            await congregationRepository.save(congregation).then(suc => {
                return res.status(201).json(suc)
            }).catch(err => {
                console.log(err)
                return res.status(500).json({ message: 'Error saving to database' })
            })
        }
    }

    async uploadCongregationPhoto(req: ParamsCustomRequest<ParamsUpdateCongregationTypes>, res: Response) {
        const { congregation_id } = req.params
        const image = req.file

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!congregation) throw new NotFoundError(messageErrors.notFound.congregation)

        if (!image) throw new BadRequestError('Any image provided')

        switch (config.storage_type) {
            case 'local':
                fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/image-home/${congregation.number}/${req.file?.filename}`, function (err) {
                    if (err) {
                        console.log(err)
                    }
                })
                console.log('Moved')
                saveBD(null)
                break;
            case 'firebase':
                await firebaseUpload(req, res, `image-home/${congregation.number}`, saveBD)
                break;
            default:
                res.send('Storage local type is not defined at .env')
                break;
        }

        async function saveBD(file: NormalizeFiles | null) {
            if (congregation) {

                if (congregation?.imageKey) {
                    await deleteFirebase(congregation?.imageKey)
                }

                congregation.image_url = file?.url ?? ""
                congregation.imageKey = file?.key ?? ""


                await congregationRepository.save(congregation).then(suc => {
                    return res.status(201).json(suc)
                }).catch(err => {
                    console.log(err)
                    return res.status(500).json({ message: 'Error saving to database' })
                })
            }
        }
    }

    async getCongregation(req: QueryCustomRequest<QueryGetCongregationTypes>, res: Response) {

        const { number } = req.params

        const congExists = await congregationRepository.findOne({
            where: { number },
        })

        if (!congExists) {
            throw new NotFoundError('Congregation not found')
        }


        const groups = await groupRepository.find({
            where: {
                congregation: {
                    id: congExists.id
                }
            }, select: ["id", "name", "number"]
        })

        return res.status(200).json({ ...congExists, groups })
    }
}

export default new CongregationController()
