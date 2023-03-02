import { Response } from "express";
import { BadRequestError, NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { profileRepository } from "../../repositories/profileRepository";
import { userRepository } from "../../repositories/userRepository";
import { deleteFirebase, firebaseUpload } from "../../provider/firebaseStorage";
import { BodyProfileCreateTypes, BodyUpdateProfilesTypes, CustomRequest, ParamsCustomRequest, ParamsProfileDeleteTypes } from "./type";
import fs from 'fs-extra'
import { config } from "../../config";
import { NormalizeFiles } from "../../types/normalizeFile";

class ProfileController {
    async create(req: CustomRequest<BodyProfileCreateTypes>, res: Response) {
        const { name, lastName, congregation_id, user_id, avatar_url } = req.body

        const file = req.file as Express.Multer.File

        const user = await userRepository.findOneBy({ id: user_id })

        const congregation = await congregationRepository.findOneBy({ id: congregation_id })

        if (!user) {
            throw new NotFoundError('User is not exists')
        }

        if (!congregation) {
            throw new NotFoundError('Congregation is not exists')
        }

        if (file) {
            switch (config.storage_type) {
                case 'local':
                    fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/${congregation.number}/${req.file?.filename}`, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    res.status(201).json({ message: 'Moved' })
                    break;
                case 'firebase':
                    await firebaseUpload(req, res, null, saveBD)
                    break;
                default:
                    res.send('Storage local type is not defined at .env')
                    break;
            }
        }

        saveBD(null)

        async function saveBD(file: NormalizeFiles | null) {
            const newProfile = profileRepository.create({
                //@ts-expect-error
                name,
                lastName,
                avatar_url: file?.url || "",
                avatar_bucket_key: file?.key || "",
                congregation,
                user
            })

            await profileRepository.save(newProfile).then(() => {
                return res.status(201).json(newProfile)
            }).catch(err => {
                const errorMessage = err.detail as string
                if (errorMessage.includes('already exists')) {
                    return res.status(400).json({
                        message: 'Profile already exists, if you want to do update use rote put(/profile)'
                    })
                }
                return res.status(500).json({ message: err })
            })
        }
    }



    async update(req: CustomRequest<BodyUpdateProfilesTypes>, res: Response) {
        const { id, name, lastName, avatar_url, congregation_id } = req.body

        const file = req.file as Express.Multer.File

        const profile = await profileRepository.findOneBy({ id })
        const congregation = await congregationRepository.findOneBy({ id: congregation_id ? congregation_id : profile?.congregation.id })

        if (!profile) {
            throw new NotFoundError("Profile not exists")
        }

        if (file) {
            switch (config.storage_type) {
                case 'local':
                    fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/users-avatar/${req.file?.filename}`, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    res.send({ message: 'Moved' })
                    break;
                case 'firebase':
                    await firebaseUpload(req, res, null, saveBD)
                    break;
                default:
                    res.send('Storage local type is not defined at .env')
                    break;
            }
        } else {
            saveBD(null)
        }

        if (!avatar_url && !name && !lastName && !congregation_id && !file) {
            throw new BadRequestError('Any change detected')
        }


        async function saveBD(file: NormalizeFiles | null) {
            if(file) {
                if(profile?.avatar_bucket_key) await deleteFirebase(profile?.avatar_bucket_key)
            }
            const updateProfile = {
                name: name ?? profile?.name,
                lastName: lastName ?? profile?.lastName,
                avatar_url: file?.url ?? profile?.avatar_url,
                avatar_bucket_key: file?.key ?? profile?.avatar_bucket_key,
                congregation: { ...congregation }
            }

            await profileRepository.save({ id, ...updateProfile }).then(suc => {
                return res.status(201).json(suc)
            }).catch(err => {
                return console.log({ message: err })
            })
        }
    }

    async delete(req: ParamsCustomRequest<ParamsProfileDeleteTypes>, res: Response) {
        const { id } = req.params

        const userProfile = await profileRepository.findOneBy({ id })

        if (!userProfile) {
            throw new NotFoundError('Profile is not exists')
        }

        await deleteFirebase(userProfile.avatar_bucket_key)

        await profileRepository.remove(userProfile).catch(err => console.log(err))

        return res.status(204).end()
    }

}

export default new ProfileController()