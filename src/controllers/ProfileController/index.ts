import { Response } from "express";
import { NotFoundError } from "../../helpers/api-errors";
import { congregationRepository } from "../../repositories/congregationRepository";
import { profileRepository } from "../../repositories/profileRepository";
import { userRepository } from "../../repositories/userRepository";
import { BodyProfileCreateTypes, BodyProfileDeleteTypes, BodyUpdateProfilesTypes, CustomRequest } from "./type";

class ProfileController{
    async create(req: CustomRequest<BodyProfileCreateTypes>, res: Response){
        const { name, lastName, congregationId, userId } = req.body

        const user = await userRepository.findOneBy({ id: Number(userId)})

        const congregation = await congregationRepository.findOneBy({ id: Number(congregationId)})

        if(!user){
            throw new NotFoundError('User is not exists')
        }

        if(!congregation){
            throw new NotFoundError('Congregation is not exists')
        }

        const newProfile = await profileRepository.create({
            name,
            lastName,
            congregation,
            user
        })

        await profileRepository.save(newProfile)

        return res.status(201).json(newProfile)
    }

    async update(req: CustomRequest<BodyUpdateProfilesTypes> , res: Response){
        const {id, name, lastName, congregationId } = req.body

        const profile = await profileRepository.findOneBy({id: Number(id)})
        const congregation = await congregationRepository.findOneBy({id: Number(congregationId ? congregationId :   profile?.congregation.id)})

        if(!profile){
            throw new NotFoundError("Profile not exists")
        }

        const updateProfile = {
            name: name || profile.name, 
            lastName: lastName || profile.lastName,
            congregation: {...congregation}
        }

        await profileRepository.save({id: Number(id), ...updateProfile})

        return res.status(200).json(updateProfile)
    }

    async delete(req: CustomRequest<BodyProfileDeleteTypes>, res: Response){
        const { id } = req.body

        const user = await profileRepository.findOneBy({id: Number(id)})

        if(!user){
            throw new NotFoundError('User is not exists')
        }

        await profileRepository.delete(user)

        return res.status(204).end()
    }

}

export default new ProfileController()