"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const privileges_1 = require("../../types/privileges");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
class PublisherControler {
    async create(req, res) {
        const { fullName, nickname, privileges, congregation_id, gender, hope } = req.body;
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
        console.log(existingPublisherSomeFullName);
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
            privileges,
            congregation
        });
        await publisherRepository_1.publisherRepository.save(newPublisher).catch(err => {
            throw new api_errors_1.BadRequestError(err);
        });
        return res.status(201).json(newPublisher);
    }
    async update(req, res) {
        const { id, fullName, nickname, privileges, gender, hope } = req.body;
        const publisher = await publisherRepository_1.publisherRepository.findOne({ where: { id } });
        if (!publisher) {
            throw new api_errors_1.NotFoundError('Publisher not exists');
        }
        if (privileges) {
            console.log(privileges);
            const privilegesExists = privileges === null || privileges === void 0 ? void 0 : privileges.every(privilege => Object.values(privileges_1.Privileges).includes(privilege));
            if (!privilegesExists) {
                throw new api_errors_1.BadRequestError('Some privilege not exists');
            }
        }
        if ((fullName === undefined || fullName === publisher.fullName) &&
            (gender === undefined || gender === publisher.gender) &&
            (hope === undefined || hope === publisher.hope) &&
            (nickname === undefined || nickname === publisher.nickname) &&
            privileges === undefined) {
            throw new api_errors_1.BadRequestError('Any change detected');
        }
        if (fullName !== publisher.fullName) {
            const existingPublisherSomeFullName = await publisherRepository_1.publisherRepository.find({
                where: {
                    fullName,
                    congregation: { id: publisher.congregation.id }
                }
            });
            if (!nickname) {
                throw new api_errors_1.BadRequestError('This fullname already exists in the congregation, a nickname is required to differentiate the publisher');
            }
            const nicknameAlreadyExists = existingPublisherSomeFullName.some(publisher => publisher.nickname === nickname);
            if (nicknameAlreadyExists)
                throw new api_errors_1.BadRequestError('Nickname already exists too');
        }
        // Atualizar as propriedades do publisher
        publisher.fullName = fullName !== undefined ? fullName : publisher.fullName;
        publisher.nickname = nickname !== undefined ? nickname : publisher.nickname;
        publisher.gender = gender !== undefined ? gender : publisher.gender;
        publisher.hope = hope !== undefined ? hope : publisher.hope;
        publisher.privileges = privileges !== undefined ? privileges : publisher.privileges;
        await publisherRepository_1.publisherRepository.save(publisher);
        return res.status(201).json(publisher);
    }
    async delete(req, res) {
        const { publisher_id: id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOne({
            where: {
                id
            },
            relations: ['groupOverseers']
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
            }, relations: ['group']
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
            select: ['fullName', 'nickname', "congregation"],
        });
        const publishersNames = publishers.map(publisher => ({
            fullName: publisher.fullName,
            nickname: publisher.nickname,
            congregation_id: congregation.id
        }));
        return res.status(200).json(publishersNames);
    }
    async getPublisher(req, res) {
        const { publisher_id } = req.params;
        const publisher = await publisherRepository_1.publisherRepository.findOneBy({ id: publisher_id });
        if (!publisher)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
        return res.status(200).json(publisher);
    }
}
exports.default = new PublisherControler();
