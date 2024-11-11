"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const noticeRepository_1 = require("../../repositories/noticeRepository");
const typeorm_1 = require("typeorm");
class CronJobController {
    async deleteNotices(req, res) {
        console.log('Task finished');
        const notices = await noticeRepository_1.noticeRepository.find({ where: {
                expired: (0, typeorm_1.LessThanOrEqual)(new Date())
            } });
        console.log(notices);
        res.send().json({ message: "Concluido" });
    }
}
exports.default = new CronJobController();
