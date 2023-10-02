"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = require("node-cron");
const noticeRepository_1 = require("../repositories/noticeRepository");
const typeorm_1 = require("typeorm");
(0, node_cron_1.schedule)('43 16 * * *', async () => {
    const now = new Date();
    const expiredRecover = await noticeRepository_1.noticeRepository.find({
        where: {
            expired: (0, typeorm_1.LessThan)(now)
        }
    });
    // Exclua os registros encontrados
    if (expiredRecover.length > 0) {
        await noticeRepository_1.noticeRepository.remove(expiredRecover);
    }
});
