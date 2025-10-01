"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const privilegesTranslations_1 = require("../../helpers/privilegesTranslations");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const emergencyContact_1 = require("../../repositories/emergencyContact");
const privilegeRepository_1 = require("../../repositories/privilegeRepository");
const publisherPrivilegeRepository_1 = require("../../repositories/publisherPrivilegeRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const userRepository_1 = require("../../repositories/userRepository");
const privileges_1 = require("../../types/privileges");
class PublisherControler {
    async create(req, res) {
        const { fullName, nickname, privileges, congregation_id, gender, hope, dateImmersed, birthDate, pioneerMonths, startPioneer, situation, phone, address, emergencyContact_id } = req.body;
        if (privileges) {
            if (privileges.includes(privileges_1.Privileges.PIONEIROAUXILIAR) && !pioneerMonths) {
                throw new api_errors_1.BadRequestError('You must provide the "pioneerMonths" field when assigning the "Pioneiro Auxiliar" privilege');
            }
            if (privileges.includes(privileges_1.Privileges.PIONEIROREGULAR) && !startPioneer) {
                throw new api_errors_1.BadRequestError('You must provide the "startPioneer" field when assigning the "Pioneiro Regular" ou "Pioneiro auxiliar indeterminado" privilege');
            }
        }
        const privilegesExists = privileges === null || privileges === void 0 ? void 0 : privileges.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.BadRequestError('Congregation not exists');
        // Verificar se o fullName já existe na congregação
        const existingPublisherSomeFullName = await publisherRepository_1.publisherRepository.find({
            where: {
                fullName,
                congregation: {
                    id: congregation.id
                }
            }
        });
        if (existingPublisherSomeFullName.length > 0) {
            if (!nickname) {
                throw new api_errors_1.BadRequestError('A nickname is required to differentiate the publisher');
            }
            const nicknameAlreadyExists = existingPublisherSomeFullName.some(publisher => publisher.nickname === nickname);
            if (nicknameAlreadyExists)
                throw new api_errors_1.BadRequestError('Nickname already exists too');
        }
        if (!privilegesExists)
            throw new api_errors_1.BadRequestError('Some privilege not exists');
        const newPublisher = publisherRepository_1.publisherRepository.create({
            fullName,
            nickname,
            gender,
            hope,
            dateImmersed,
            birthDate,
            privileges,
            pioneerMonths,
            congregation,
            startPioneer,
            situation,
            phone,
            address
        });
        if (emergencyContact_id) {
            const contact = await emergencyContact_1.emergencyContactRepository.findOneBy({ id: emergencyContact_id });
            newPublisher.emergencyContact = contact !== null && contact !== void 0 ? contact : null; // permite que seja null
        }
        await publisherRepository_1.publisherRepository.save(newPublisher).catch(err => {
            throw new api_errors_1.BadRequestError(err);
        });
        if (privileges === null || privileges === void 0 ? void 0 : privileges.length) {
            for (const privilegePT of privileges) {
                const privilegeEN = privilegesTranslations_1.privilegePTtoEN[privilegePT];
                if (!privilegeEN)
                    continue; // ou lançar erro se quiser validar
                const privilegeEntity = await privilegeRepository_1.privilegeRepository.findOneBy({ name: privilegeEN });
                if (privilegeEntity) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher: newPublisher,
                        privilege: privilegeEntity,
                        startDate: startPioneer !== null && startPioneer !== void 0 ? startPioneer : null,
                        endDate: null
                    });
                }
            }
        }
        return res.status(201).json(newPublisher);
    }
    async update(req, res) {
        const { publisher_id: id } = req.params;
        const { fullName, nickname, privileges, gender, hope, dateImmersed, birthDate, pioneerMonths, situation, phone, address, startPioneer, emergencyContact_id } = req.body;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: { id },
            relations: ["congregation"]
        });
        if (!publisher) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        }
        if (privileges) {
            if (privileges.includes(privileges_1.Privileges.PIONEIROAUXILIAR) && !pioneerMonths) {
                throw new api_errors_1.BadRequestError('You must provide the "pioneerMonths" field when assigning the "PIONEIRO AUXILIAR" privilege');
            }
            if (privileges.includes(privileges_1.Privileges.PIONEIROREGULAR) && !startPioneer) {
                throw new api_errors_1.BadRequestError('You must provide the "startRegularPioneer" field when assigning the "Pioneiro Regular" privilege');
            }
            const privilegesExists = privileges === null || privileges === void 0 ? void 0 : privileges.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
            if (!privilegesExists) {
                throw new api_errors_1.BadRequestError('Some privilege not exists');
            }
        }
        if (emergencyContact_id) {
            const contact = await emergencyContact_1.emergencyContactRepository.findOneBy({ id: emergencyContact_id });
            publisher.emergencyContact = contact !== null && contact !== void 0 ? contact : null; // permite que seja null
        }
        if (fullName && fullName !== publisher.fullName) {
            const existingPublisherSomeFullName = await publisherRepository_1.publisherRepository.find({
                where: {
                    fullName,
                    congregation: {
                        id: publisher.congregation.id
                    }
                }
            });
            if (existingPublisherSomeFullName.length > 0 && !nickname) {
                throw new api_errors_1.BadRequestError('This fullname already exists in the congregation, a nickname is required to differentiate the publisher');
            }
            const nicknameAlreadyExists = existingPublisherSomeFullName.some(publisher => publisher.nickname === nickname);
            if (nicknameAlreadyExists)
                throw new api_errors_1.BadRequestError('Nickname already exists too');
        }
        const privilegesEN = (0, privilegesTranslations_1.translatePrivilegesPTToEN)(privileges !== null && privileges !== void 0 ? privileges : []);
        // Atualizar as propriedades do publisher
        publisher.fullName = fullName !== undefined ? fullName : publisher.fullName;
        publisher.nickname = nickname !== undefined ? nickname : publisher.nickname;
        publisher.gender = gender !== undefined ? gender : publisher.gender;
        publisher.hope = hope !== undefined ? hope : publisher.hope;
        publisher.privileges = privileges !== undefined ? privileges : publisher.privileges;
        publisher.pioneerMonths = pioneerMonths !== undefined ? pioneerMonths : publisher.pioneerMonths;
        publisher.birthDate = birthDate !== undefined ? birthDate : publisher.birthDate;
        publisher.dateImmersed = dateImmersed !== undefined ? dateImmersed : publisher.dateImmersed;
        publisher.situation = situation !== undefined ? situation : publisher.situation;
        publisher.startPioneer = startPioneer !== undefined ? startPioneer : publisher.startPioneer;
        publisher.phone = phone !== undefined ? phone : publisher.phone;
        publisher.address = address !== undefined ? address : publisher.address;
        publisher.privileges = privileges && (privileges === null || privileges === void 0 ? void 0 : privileges.length) > 0 ? privileges : publisher.privileges;
        await publisherRepository_1.publisherRepository.save(publisher);
        if (privileges && privileges.length > 0) {
            const privilegesEN = (0, privilegesTranslations_1.translatePrivilegesPTToEN)(privileges);
            // Busca entidades reais dos privilégios em inglês
            const privilegeEntities = await privilegeRepository_1.privilegeRepository.findBy({
                name: (0, typeorm_1.In)(privilegesEN)
            });
            // Extrai os IDs
            const privilegeIds = privilegeEntities.map(p => p.id);
            // Remove privilégios antigos que não estão mais na lista
            await publisherPrivilegeRepository_1.publisherPrivilegeRepository.delete({
                publisher: { id: publisher.id },
                privilege: { id: (0, typeorm_1.Not)((0, typeorm_1.In)(privilegeIds)) }
            });
            for (const privilegeName of privilegesEN) {
                const privilegeEntity = await privilegeRepository_1.privilegeRepository.findOneBy({ name: privilegeName });
                if (!privilegeEntity)
                    continue;
                const exists = await publisherPrivilegeRepository_1.publisherPrivilegeRepository.findOne({
                    where: { publisher: { id: publisher.id }, privilege: { id: privilegeEntity.id } }
                });
                if (!exists) {
                    await publisherPrivilegeRepository_1.publisherPrivilegeRepository.save({
                        publisher,
                        privilege: privilegeEntity,
                        startDate: startPioneer !== null && startPioneer !== void 0 ? startPioneer : null,
                        endDate: null
                    });
                }
            }
        }
        return res.status(201).json(publisher);
    }
    async delete(req, res) {
        const { publisher_id: id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id
            }
        });
        if (!publisher)
            throw new api_errors_1.BadRequestError('Publisher not exists');
        await publisherRepository_1.publisherRepository.remove(publisher);
        return res.status(200).end();
    }
    async getPublishers(req, res) {
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            }, relations: ['group', 'congregation', "emergencyContact"]
        }).catch(err => console.log(err));
        return res.status(200).json(publishers);
    }
    async getPublishersWithCongregatioNumber(req, res) {
        const { congregationNumber } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ number: congregationNumber });
        if (!congregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: {
                congregation: {
                    id: congregation.id
                }
            },
            select: ['fullName', 'nickname', "congregation", "id"],
        });
        const publishersNames = publishers.map(publisher => ({
            id: publisher.id,
            fullName: publisher.fullName,
            nickname: publisher.nickname,
            congregation_id: congregation.id,
            congregation_number: congregation.number
        }));
        return res.status(200).json(publishersNames);
    }
    async getPublisher(req, res) {
        const { publisher_id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id: publisher_id
            },
            relations: ["user", "emergencyContact"],
        });
        if (!publisher)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        return res.status(200).json(publisher);
    }
    async unlinkPublisherFromUser(req, res) {
        const { publisher_id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id: publisher_id
            },
            relations: ["user"]
        });
        if (!publisher) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        }
        if (!publisher.user) {
            throw new api_errors_1.BadRequestError("This publisher is not linked to any user");
        }
        const user = publisher.user;
        // remove vínculo
        user.publisher = null;
        await userRepository_1.userRepository.save(user);
        return res.json({ message: "Publisher unlinked successfully" });
    }
}
exports.default = new PublisherControler();
