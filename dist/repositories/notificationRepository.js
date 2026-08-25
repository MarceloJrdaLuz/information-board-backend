"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = void 0;
const data_source_1 = require("../data-source");
const Notification_1 = require("../entities/Notification");
exports.notificationRepository = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
