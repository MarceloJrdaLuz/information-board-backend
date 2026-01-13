"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisherReminderRepository = void 0;
const data_source_1 = require("../data-source");
const PublisherReminders_1 = require("../entities/PublisherReminders");
exports.publisherReminderRepository = data_source_1.AppDataSource.getRepository(PublisherReminders_1.PublisherReminder);
