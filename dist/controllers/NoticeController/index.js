"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const congregationRepository_1 = require("../../repositories/congregationRepository");
const noticeRepository_1 = require("../../repositories/noticeRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
class NoticeController {
    async create(req, res) {
        const { title, text, expired, startDay, endDay } = req.body;
        const { congregation_id } = req.params;
        const congregation = await congregationRepository_1.congregationRepository.findOneBy({ id: congregation_id });
        if (!congregation) {
            throw new api_errors_1.BadRequestError('Congregation not found');
        }
        const newNotice = noticeRepository_1.noticeRepository.create({
            title,
            text,
            expired,
            startDay,
            endDay,
            congregation
        });
        await noticeRepository_1.noticeRepository.save(newNotice).then(suc => {
            return res.status(201).json(suc);
        }).catch(err => {
            console.log(err);
        });
    }
    async getNotices(req, res) {
        const { congregation_id } = req.params;
        const notices = await noticeRepository_1.noticeRepository.find({
            where: {
                congregation: {
                    id: congregation_id
                }
            },
        });
        return res.send(notices);
    }
    async getNotice(req, res) {
        const { notice_id } = req.params;
        const notice = await noticeRepository_1.noticeRepository.findOneBy({ id: notice_id });
        if (!notice)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.notice);
        return res.status(200).json(notice);
    }
    async update(req, res) {
        const { notice_id } = req.params;
        const { text, title, startDay, endDay, expired } = req.body;
        const notice = await noticeRepository_1.noticeRepository.findOneBy({ id: notice_id });
        if (!notice)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.notice);
        notice.title = title !== undefined ? title : notice.title;
        notice.text = text !== undefined ? text : notice.text;
        notice.startDay = startDay !== undefined ? startDay : notice.startDay;
        notice.endDay = endDay !== undefined ? endDay : notice.endDay;
        notice.expired = expired !== undefined ? expired : notice.expired;
        await noticeRepository_1.noticeRepository.save(notice);
        return res.status(201).json(notice);
    }
    async delete(req, res) {
        const { notice_id } = req.params;
        const notice = await noticeRepository_1.noticeRepository.findOneBy({ id: notice_id });
        if (!notice) {
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.notice);
        }
        await noticeRepository_1.noticeRepository.remove(notice);
        return res.status(200).end();
    }
}
exports.default = new NoticeController();
