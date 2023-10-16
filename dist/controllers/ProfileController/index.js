"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const profileRepository_1 = require("../../repositories/profileRepository");
const userRepository_1 = require("../../repositories/userRepository");
const firebaseStorage_1 = require("../../provider/firebaseStorage");
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("../../config");
class ProfileController {
    async create(req, res) {
        var _a, _b;
        const { user_id } = req.params;
        const file = req.file;
        const user = await userRepository_1.userRepository.findOneBy({ id: user_id });
        if (!user) {
            throw new api_errors_1.NotFoundError('User is not exists');
        }
        if (file) {
            switch (config_1.config.storage_type) {
                case 'local':
                    fs_extra_1.default.move(`./tmp/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`, `./tmp/uploads/users-avatar/${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}`, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    console.log('moved');
                    saveBD(null);
                    break;
                case 'firebase':
                    await (0, firebaseStorage_1.firebaseUpload)(req, res, `users-avatar`, saveBD);
                    break;
                default:
                    res.send('Storage local type is not defined at .env');
                    break;
            }
        }
        else
            saveBD(null);
        async function saveBD(file) {
            var _a, _b;
            const newProfile = profileRepository_1.profileRepository.create({
                avatar_url: (_a = file === null || file === void 0 ? void 0 : file.url) !== null && _a !== void 0 ? _a : "",
                avatar_bucket_key: (_b = file === null || file === void 0 ? void 0 : file.key) !== null && _b !== void 0 ? _b : "",
                user: user !== null && user !== void 0 ? user : undefined
            });
            await profileRepository_1.profileRepository.save(newProfile).then(() => {
                return res.status(201).json(newProfile);
            }).catch(err => {
                const errorMessage = err.driverError.detail;
                if (errorMessage.includes('already exists')) {
                    return res.status(400).json({
                        message: 'Profile already exists, if you want to do update use rote put(/profile)'
                    });
                }
                console.log(err);
                return res.status(500).send({ message: 'Internal server error, checks the logs' });
            });
        }
    }
    async update(req, res) {
        var _a, _b;
        const { id, avatar_url } = req.body;
        const file = req.file;
        const profile = await profileRepository_1.profileRepository.findOneBy({ id });
        if (!profile) {
            throw new api_errors_1.NotFoundError("Profile not exists");
        }
        if (!avatar_url && !file) {
            throw new api_errors_1.BadRequestError('Any change detected');
        }
        if (file) {
            switch (config_1.config.storage_type) {
                case 'local':
                    fs_extra_1.default.move(`./tmp/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`, `./tmp/uploads/users-avatar/${(_b = req.file) === null || _b === void 0 ? void 0 : _b.filename}`, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    console.log('Moved');
                    saveBD(null);
                    break;
                case 'firebase':
                    await (0, firebaseStorage_1.firebaseUpload)(req, res, `users-avatar`, saveBD);
                    break;
                default:
                    res.send('Storage local type is not defined at .env');
                    break;
            }
        }
        else
            saveBD(null);
        async function saveBD(file) {
            var _a, _b;
            if (file) {
                if (profile === null || profile === void 0 ? void 0 : profile.avatar_bucket_key)
                    await (0, firebaseStorage_1.deleteFirebase)(profile === null || profile === void 0 ? void 0 : profile.avatar_bucket_key);
            }
            const updateProfile = {
                avatar_url: (_a = file === null || file === void 0 ? void 0 : file.url) !== null && _a !== void 0 ? _a : profile === null || profile === void 0 ? void 0 : profile.avatar_url,
                avatar_bucket_key: (_b = file === null || file === void 0 ? void 0 : file.key) !== null && _b !== void 0 ? _b : profile === null || profile === void 0 ? void 0 : profile.avatar_bucket_key,
            };
            await profileRepository_1.profileRepository.save({ id, ...updateProfile }).then(suc => {
                return res.status(201).json(suc);
            }).catch(err => {
                console.log(err);
                return res.status(500).json({ message: 'Internal server error' });
            });
        }
    }
    async delete(req, res) {
        const { id } = req.params;
        const userProfile = await profileRepository_1.profileRepository.findOneBy({ id });
        if (!userProfile) {
            throw new api_errors_1.NotFoundError('Profile is not exists');
        }
        await (0, firebaseStorage_1.deleteFirebase)(userProfile.avatar_bucket_key);
        await profileRepository_1.profileRepository.remove(userProfile).catch(err => console.log(err));
        return res.status(204).end();
    }
}
exports.default = new ProfileController();
