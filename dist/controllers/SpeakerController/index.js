"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const messageErrors_1 = require("../../helpers/messageErrors");
const speakerRepository_1 = require("../../repositories/speakerRepository");
const talkRepository_1 = require("../../repositories/talkRepository");
const publisherRepository_1 = require("../../repositories/publisherRepository");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const typeorm_1 = require("typeorm");
const permissions_1 = require("../../middlewares/permissions");
const userRepository_1 = require("../../repositories/userRepository");
class SpeakerController {
    async create(req, res) {
        const { fullName, phone, address, originCongregation_id, publisher_id, talk_ids } = req.body;
        const requestUser = await (0, permissions_1.decoder)(req);
        const userReq = await userRepository_1.userRepository.findOne({
            where: {
                id: requestUser.id
            },
            select: ["congregation"]
        });
        let originCongregation = await congregationRepository_1.congregationRepository.findOneBy({ id: originCongregation_id });
        if (!originCongregation)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.originCongregation);
        let publisher = null;
        let speakerFullName = fullName;
        let speakerPhone = phone;
        let speakerAddress = address;
        if (publisher_id) {
            const publisher = await (0, publisherRepository_1.findPublisherWithPrivilege)(publisher_id, "Speaker");
            if (!publisher)
                throw new api_errors_1.BadRequestError("Publisher not found or does not have 'Speaker'");
            if (publisher.congregation.id !== originCongregation_id) {
                throw new api_errors_1.BadRequestError("Publisher does not belong to the same congregation as the speaker");
            }
            // Preenche os dados do speaker com os dados do publisher
            speakerFullName = publisher.fullName;
            speakerPhone = publisher.phone;
            speakerAddress = publisher.address;
            originCongregation = publisher.congregation;
        }
        const talks = talk_ids && talk_ids.length > 0
            ? await talkRepository_1.talkRepository.findBy({
                id: (0, typeorm_1.In)(talk_ids)
            })
            : [];
        try {
            const newSpeaker = speakerRepository_1.speakerRepository.create({
                fullName: speakerFullName,
                phone: speakerPhone,
                address: speakerAddress,
                creatorCongregation: userReq === null || userReq === void 0 ? void 0 : userReq.congregation,
                originCongregation,
                publisher,
                talks,
            });
            await speakerRepository_1.speakerRepository.save(newSpeaker);
            return res.status(201).json(newSpeaker);
        }
        catch (error) {
            if (error.code === "23505") { // Postgres unique violation
                throw new api_errors_1.BadRequestError("A speaker with this name and publisher already exists in your congregation");
            }
            throw error;
        }
    }
    async update(req, res) {
        const { speaker_id } = req.params;
        const { fullName, phone, address, publisher_id, talk_ids, originCongregation_id } = req.body;
        const speaker = await speakerRepository_1.speakerRepository.findOne({
            where: { id: speaker_id },
            relations: ["publisher", "talks"],
        });
        if (!speaker)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.speaker);
        speaker.fullName = fullName !== null && fullName !== void 0 ? fullName : speaker.fullName;
        speaker.phone = phone !== null && phone !== void 0 ? phone : speaker.phone;
        speaker.address = address !== null && address !== void 0 ? address : speaker.address;
        if (publisher_id) {
            // Novo publisher enviado → atualizar dados e congregação do Speaker
            const newPublisher = await publisherRepository_1.publisherRepository.findOne({
                where: { id: publisher_id },
                relations: ["congregation"],
            });
            if (!newPublisher)
                throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.publisher);
            // Atualiza dados do Speaker com o Publisher
            speaker.fullName = newPublisher.fullName;
            speaker.phone = newPublisher.phone;
            speaker.address = newPublisher.address;
            speaker.originCongregation = newPublisher.congregation;
            speaker.publisher = newPublisher;
        }
        else {
            // Sem publisher_id → desvincula publisher
            speaker.publisher = null;
            speaker.fullName = fullName !== null && fullName !== void 0 ? fullName : speaker.fullName;
            speaker.phone = phone !== null && phone !== void 0 ? phone : speaker.phone;
            speaker.address = address !== null && address !== void 0 ? address : speaker.address;
            if (originCongregation_id) {
                const newCongregation = await congregationRepository_1.congregationRepository.findOneBy({ id: originCongregation_id });
                if (!newCongregation)
                    throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.congregation);
                speaker.originCongregation = newCongregation;
            }
        }
        if (talk_ids !== undefined) {
            speaker.talks = talk_ids.length > 0
                ? await talkRepository_1.talkRepository.findBy({
                    id: (0, typeorm_1.In)(talk_ids)
                })
                : [];
        }
        await speakerRepository_1.speakerRepository.save(speaker);
        return res.json(speaker);
    }
    async delete(req, res) {
        const { speaker_id } = req.params;
        const speaker = await speakerRepository_1.speakerRepository.findOneBy({ id: speaker_id });
        if (!speaker)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.speaker);
        await speakerRepository_1.speakerRepository.remove(speaker);
        return res.status(200).end();
    }
    async getSpeakers(req, res) {
        const requestUser = await (0, permissions_1.decoder)(req);
        const userReq = await userRepository_1.userRepository.findOne({
            where: {
                id: requestUser.id
            },
        });
        const speakers = await speakerRepository_1.speakerRepository.find({
            where: { creatorCongregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
            relations: ["originCongregation", "talks"],
            order: { fullName: "ASC" },
        });
        return res.json(speakers);
    }
    async getPublishersSpeaker(req, res) {
        const requestUser = await (0, permissions_1.decoder)(req);
        const userReq = await userRepository_1.userRepository.findOne({
            where: {
                id: requestUser.id
            },
        });
        const publishers = await publisherRepository_1.publisherRepository.find({
            where: { congregation: { id: userReq === null || userReq === void 0 ? void 0 : userReq.congregation.id } },
            relations: ["privilegesRelation", "privilegesRelation.privilege", "congregation"],
            order: { fullName: "ASC" },
        });
        const speakers = publishers.filter(pp => pp.privilegesRelation.some(p => p.privilege.name === "Speaker"));
        return res.json(speakers);
    }
    async getSpeaker(req, res) {
        const { speaker_id } = req.params;
        const speaker = await speakerRepository_1.speakerRepository.findOne({
            where: { id: speaker_id },
            relations: ["originCongregation"]
        });
        if (!speaker)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.speaker);
        return res.json(speaker);
    }
}
exports.default = new SpeakerController();
