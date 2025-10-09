import { Request, Response } from "express";
import fs from 'fs-extra';
import { config } from "../../config";
import { Congregation, CongregationType } from "../../entities/Congregation";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { messageErrors } from "../../helpers/messageErrors";
import { decoder } from "../../middlewares/permissions";
import { deleteFirebase, firebaseUpload } from "../../provider/firebaseStorage";
import { congregationRepository } from "../../repositories/congregationRepository";
import { groupRepository } from "../../repositories/groupRepository";
import { userRepository } from "../../repositories/userRepository";
import { CustomRequest, CustomRequestPT, ParamsCustomRequest, QueryCustomRequest } from "../../types/customRequest";
import { NormalizeFiles } from "../../types/normalizeFile";
import { BodyAuxiliaryCongregationCreateTypes, BodyAuxiliaryCongregationUpdateTypes, BodyCongregationCreateTypes, BodyCongregationUpdateTypes, ParamsCongregationDeleteTypes, ParamsUpdateCongregationTypes, QueryCongregationDeleteTypes, QueryGetCongregationTypes } from "./types";
import { speakerRepository } from "../../repositories/speakerRepository";
import { In } from "typeorm";
import { Speaker } from "../../entities/Speaker";


class CongregationController {
    async create(req: CustomRequest<BodyCongregationCreateTypes>, res: Response) {
        const { name, number, city, circuit, image_url } = req.body

        const file = req.file as Express.Multer.File

        const congExists = await congregationRepository.findOne({
            where: [
                { number },                 // já verifica se o número existe
                { name, city }              // verifica se já existe name + city
            ]
        });

        if (congExists) {
            if (congExists.number === number) {
                throw new BadRequestError(`A congregation with number "${number}" already exists.`);
            } else {
                throw new BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
            }
        }

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
                type: CongregationType.SYSTEM,
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

        if (!congregation) new NotFoundError(messageErrors.notFound.congregation)

        const existingCongregation = await congregationRepository.findOne({
            where: {
                name, city
            }
        });

        if (existingCongregation) {
            throw new BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
        }

        if (congregation) {

            congregation.name = name ?? congregation?.name
            congregation.circuit = circuit ?? congregation?.circuit
            congregation.city = city ?? congregation?.city
            congregation.dayMeetingLifeAndMinistary = dayMeetingLifeAndMinistary ?? congregation?.dayMeetingLifeAndMinistary
            congregation.hourMeetingLifeAndMinistary = hourMeetingLifeAndMinistary ?? congregation?.hourMeetingLifeAndMinistary
            congregation.dayMeetingPublic = dayMeetingPublic ?? congregation?.dayMeetingPublic
            congregation.hourMeetingPublic = hourMeetingPublic ?? congregation?.hourMeetingPublic
            congregation.type = CongregationType.SYSTEM

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

    async list(req: Request, res: Response) {
        const requestByUserId = await decoder(req)

        const congregationsResponse: Congregation[] = []

        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN_CONGREGATION') {
            const requestUser = await userRepository.findOne({
                where: {
                    id: requestByUserId.id
                }
            })

            if (requestUser) {
                const cong = await congregationRepository.findOne({
                    where: {
                        id: requestUser.congregation.id
                    }
                })

                if (cong) congregationsResponse.push(cong)
            }
        }

        if (requestByUserId && requestByUserId.roles && requestByUserId.roles[0] && requestByUserId.roles[0].name === 'ADMIN') {
            const congExists = await congregationRepository.find({})

            if (congExists) congregationsResponse.push(...congExists)
        }


        if (!congregationsResponse) {
            throw new NotFoundError('Congregations not found')
        }

        return res.status(200).json(congregationsResponse)
    }

    async getCongregation(req: QueryCustomRequest<QueryGetCongregationTypes>, res: Response) {

        const { number } = req.params

        const congExists = await congregationRepository.findOne({
            where: {
                number,
                type: CongregationType.SYSTEM
            },
        })

        if (!congExists) {
            throw new NotFoundError(messageErrors.notFound.congregation)
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

    async getAuxiliaryCongregations(req: Request, res: Response) {
        const requestByUserId = await decoder(req)
        const requestUser = await userRepository.findOne({
            where: {
                id: requestByUserId.id
            }
        })

        if (requestUser) {
            const congregations = await congregationRepository.find({
                where: {
                    type: CongregationType.AUXILIARY,
                    creatorCongregation: {
                        id: requestUser.congregation.id
                    }
                }
            })
            let speakers: Speaker[] = [];
            const congregationIds = congregations.map(c => c.id);

            if (congregationIds.length > 0) {
                speakers = await speakerRepository.find({
                    where: {
                        originCongregation: { id: In(congregationIds) }
                    },
                    relations: ["originCongregation"]
                })
            }
            //  Mapear os speakers para a congregação correspondente
            const congregationsWithSpeakers = congregations.map(c => ({
                ...c,
                speakers: speakers.filter(s => s.originCongregation.id === c.id)
            }));

            return res.status(200).json(congregationsWithSpeakers);
        }
    }

    async createAuxiliaryCongregation(req: CustomRequest<BodyAuxiliaryCongregationCreateTypes>, res: Response) {
        const { name, number, city, circuit, dayMeetingPublic, hourMeetingPublic } = req.body

        const requestUser = await decoder(req)
        const userReq = await userRepository.findOne({
            where: {
                id: requestUser.id
            }
        })

        const congExists = await congregationRepository.findOne({
            where: [
                { number },
                { name, city }
            ]
        });

        if (congExists) {
            if (congExists.number === number) {
                throw new BadRequestError(`A congregation with number "${number}" already exists.`);
            } else {
                throw new BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
            }
        }

        if (congExists) {
            throw new BadRequestError('Congregation already exists')
        }

        const newCongregation = congregationRepository.create({
            name,
            number,
            city,
            circuit,
            type: CongregationType.AUXILIARY,
            dayMeetingPublic,
            hourMeetingPublic,
            creatorCongregation: userReq?.congregation
        })

        await congregationRepository.save(newCongregation)
        res.status(201).send(newCongregation)
    }

    async updateAuxiliaryCongregation(req: CustomRequestPT<ParamsUpdateCongregationTypes, BodyAuxiliaryCongregationUpdateTypes>, res: Response) {
        const { congregation_id } = req.params
        const { name, number, city, circuit, dayMeetingPublic, hourMeetingPublic } = req.body

        const requestUser = await decoder(req)
        const userReq = await userRepository.findOne({
            where: {
                id: requestUser.id
            }
        })

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!congregation) {
            throw new BadRequestError(messageErrors.notFound.congregation)
        }

        const existingCongregation = await congregationRepository.findOne({
            where: [
                { number },
                { name, city }
            ]
        });

        if (existingCongregation && existingCongregation.id !== congregation_id) {
            if (existingCongregation.number === number) {
                throw new BadRequestError(`A congregation with number "${number}" already exists.`);
            } else {
                throw new BadRequestError(`A congregation with name "${name}" already exists in city "${city}".`);
            }
        }

        congregation.name = name ?? congregation.name
        congregation.number = number ?? congregation.number
        congregation.city = city ?? congregation.city
        congregation.circuit = circuit ?? congregation.circuit
        congregation.type = congregation.type
        congregation.dayMeetingPublic = dayMeetingPublic ?? congregation.dayMeetingPublic
        congregation.hourMeetingPublic = hourMeetingPublic ?? congregation.hourMeetingPublic

        await congregationRepository.save(congregation)
        res.status(201).send(congregation)
    }

    async deleteAuxiliaryCongregation(req: QueryCustomRequest<ParamsCongregationDeleteTypes>, res: Response) {
        const { congregation_id: id } = req.params
        const requestByUserId = await decoder(req)
        const requestUser = await userRepository.findOne({
            where: {
                id: requestByUserId.id
            }
        })

        if (requestUser) {
            const congregation = await congregationRepository.findOne({
                where: {
                    id,
                    type: CongregationType.AUXILIARY,
                    creatorCongregation: {
                        id: requestUser.congregation.id
                    }
                }
            })

            if (!congregation) {
                throw new NotFoundError(messageErrors.notFound.congregation)
            }
            await congregationRepository.remove(congregation)
        }
        return res.status(200).end()
    }
}

export default new CongregationController()
