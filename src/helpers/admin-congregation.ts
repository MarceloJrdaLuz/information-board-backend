import { profileRepository } from "../repositories/profileRepository";

export async function adminCongregation(user_id: string, congregation_id: string){
    const userCongregation = await profileRepository.find({
        where: {
            congregation: {
                id: congregation_id
            },
            user: {
                id:user_id
            }
        }
    })
    if(userCongregation.length < 1) return false
}