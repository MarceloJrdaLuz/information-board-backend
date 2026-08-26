"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchAggregatedPushes = exports.addPushEvent = void 0;
const pushNotificationService_1 = require("../../services/pushNotificationService");
function addPushEvent(eventsByUser, userId, event) {
    if (!eventsByUser.has(userId))
        eventsByUser.set(userId, []);
    eventsByUser.get(userId).push(event);
}
exports.addPushEvent = addPushEvent;
async function dispatchAggregatedPushes(eventsByUser) {
    for (const [userId, events] of eventsByUser.entries()) {
        const newEvents = events.filter(e => e.type === 'NEW');
        const canceledEvents = events.filter(e => e.type === 'CANCELED');
        if (newEvents.length === 1) {
            const ev = newEvents[0];
            await pushNotificationService_1.pushNotificationService.sendToPublisher(userId, {
                title: `Nova Designação: ${ev.role}`,
                body: `Você foi designado como ${ev.role} no dia ${ev.dateFmt}.`,
                type: ev.notifType,
                data: { url: ev.url, date: ev.date }
            }).catch(err => console.error("Erro ao enviar push:", err));
        }
        else if (newEvents.length > 1) {
            await pushNotificationService_1.pushNotificationService.sendToPublisher(userId, {
                title: `Novas Designações (${newEvents.length})`,
                body: `Você recebeu ${newEvents.length} novas designações para os próximos dias.`,
                data: { url: "/dashboard" }
            }).catch(err => console.error("Erro ao enviar push:", err));
        }
        if (canceledEvents.length === 1) {
            const ev = canceledEvents[0];
            await pushNotificationService_1.pushNotificationService.sendToPublisher(userId, {
                title: `Designação Cancelada`,
                body: `Sua designação de ${ev.role} do dia ${ev.dateFmt} foi cancelada.`,
                type: ev.notifType,
                data: { url: ev.url, date: ev.date }
            }).catch(err => console.error("Erro ao enviar push:", err));
        }
        else if (canceledEvents.length > 1) {
            await pushNotificationService_1.pushNotificationService.sendToPublisher(userId, {
                title: `Designações Canceladas (${canceledEvents.length})`,
                body: `Você teve ${canceledEvents.length} designações canceladas.`,
                data: { url: "/dashboard" }
            }).catch(err => console.error("Erro ao enviar push:", err));
        }
    }
}
exports.dispatchAggregatedPushes = dispatchAggregatedPushes;
