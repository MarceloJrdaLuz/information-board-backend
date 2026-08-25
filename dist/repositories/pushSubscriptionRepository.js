"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushSubscriptionRepository = void 0;
const data_source_1 = require("../data-source");
const PushSubscription_1 = require("../entities/PushSubscription");
exports.pushSubscriptionRepository = data_source_1.AppDataSource.getRepository(PushSubscription_1.PushSubscription);
