import { Response } from "express"
import { BadRequestError, NotFoundError } from "../../helpers/api-errors"
import { profileRepository } from "../../repositories/profileRepository"
import { userRepository } from "../../repositories/userRepository"
import { deleteFirebase, firebaseUpload } from "../../provider/firebaseStorage"
import { BodyProfileCreateTypes, BodyUpdateProfilesTypes, ParamsProfileDeleteTypes } from "./types"
import fs from 'fs-extra'
import { config } from "../../config"
import { NormalizeFiles } from "../../types/normalizeFile"
import { CustomRequest, ParamsCustomRequest } from "../../types/customRequest"

class ProfileController {
    async create(req: CustomRequest<BodyProfileCreateTypes>, res: Response) {
        const {  user_id } = req.body

        const file = req.file as Express.Multer.File

        const user = await userRepository.findOneBy({ id: user_id })

        if (!user) {
            throw new NotFoundError('User is not exists')
        }

        if (file) {
            switch (config.storage_type) {
                case 'local':
                    fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/users-avatar/${req.file?.filename}`, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    console.log('moved')
                    saveBD(null)
                    break
                case 'firebase':
                    await firebaseUpload(req, res, `users-avatar`, saveBD)
                    break
                default:
                    res.send('Storage local type is not defined at .env')
                    break
            }
        } else saveBD(null)

        async function saveBD(file: NormalizeFiles | null) {
            const newProfile = profileRepository.create({
                avatar_url: file?.url ?? "",
                avatar_bucket_key: file?.key ?? "",
                user: user ?? undefined
            })

            await profileRepository.save(newProfile).then(() => {
                return res.status(201).json(newProfile)
            }).catch(err => {
                const errorMessage = err.driverError.detail as string
                if (errorMessage.includes('already exists')) {
                    return res.status(400).json({
                        message: 'Profile already exists, if you want to do update use rote put(/profile)'
                    })
                }
                console.log(err)
                return res.status(500).send({ message: 'Internal server error, checks the logs' })
            })
        }
    }

    async update(req: CustomRequest<BodyUpdateProfilesTypes>, res: Response) {
        const { id, avatar_url } = req.body

        const file = req.file as Express.Multer.File

        const profile = await profileRepository.findOneBy({ id })

        if (!profile) {
            throw new NotFoundError("Profile not exists")
        }

        if (!avatar_url && !file) {
            throw new BadRequestError('Any change detected')
        }

        if (file) {
            switch (config.storage_type) {
                case 'local':
                    fs.move(`./tmp/uploads/${req.file?.filename}`, `./tmp/uploads/users-avatar/${req.file?.filename}`, function (err) {
                        if (err) {
                            console.log(err)
                        }
                    })
                    console.log('Moved')
                    saveBD(null)
                    break
                case 'firebase':
                    await firebaseUpload(req, res, `users-avatar`, saveBD)
                    break
                default:
                    res.send('Storage local type is not defined at .env')
                    break
            }
        } else saveBD(null) 


        async function saveBD(file: NormalizeFiles | null) {
            if (file) {
                if (profile?.avatar_bucket_key) await deleteFirebase(profile?.avatar_bucket_key)
            }
            const updateProfile = {
                avatar_url: file?.url ?? profile?.avatar_url,
                avatar_bucket_key: file?.key ?? profile?.avatar_bucket_key,
            }

            await profileRepository.save({ id, ...updateProfile }).then(suc => {
                return res.status(201).json(suc)
            }).catch(err => {
                console.log(err)
                return res.status(500).json({ message: 'Internal server error' })
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