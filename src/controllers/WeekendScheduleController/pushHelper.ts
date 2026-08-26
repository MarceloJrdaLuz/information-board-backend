import { NotificationType } from "../../entities/Notification"
import { pushNotificationService } from "../../services/pushNotificationService"

export type PushEvent = {
  dateFmt: string
  type: 'NEW' | 'CANCELED'
  role: string
  url: string
  date: string
  notifType: NotificationType
}

export function addPushEvent(eventsByUser: Map<string, PushEvent[]>, userId: string, event: PushEvent) {
  if (!eventsByUser.has(userId)) eventsByUser.set(userId, [])
  eventsByUser.get(userId)!.push(event)
}

export async function dispatchAggregatedPushes(eventsByUser: Map<string, PushEvent[]>) {
  for (const [userId, events] of eventsByUser.entries()) {
    const newEvents = events.filter(e => e.type === 'NEW')
    const canceledEvents = events.filter(e => e.type === 'CANCELED')

    if (newEvents.length === 1) {
      const ev = newEvents[0]
      await pushNotificationService.sendToPublisher(userId, {
        title: `Nova Designação: ${ev.role}`,
        body: `Você foi designado como ${ev.role} no dia ${ev.dateFmt}.`,
        type: ev.notifType,
        data: { url: ev.url, date: ev.date }
      }).catch(err => console.error("Erro ao enviar push:", err))
    } else if (newEvents.length > 1) {
      await pushNotificationService.sendToPublisher(userId, {
        title: `Novas Designações (${newEvents.length})`,
        body: `Você recebeu ${newEvents.length} novas designações para os próximos dias.`,
        data: { url: "/dashboard" }
      }).catch(err => console.error("Erro ao enviar push:", err))
    }

    if (canceledEvents.length === 1) {
      const ev = canceledEvents[0]
      await pushNotificationService.sendToPublisher(userId, {
        title: `Designação Cancelada`,
        body: `Sua designação de ${ev.role} do dia ${ev.dateFmt} foi cancelada.`,
        type: ev.notifType,
        data: { url: ev.url, date: ev.date }
      }).catch(err => console.error("Erro ao enviar push:", err))
    } else if (canceledEvents.length > 1) {
      await pushNotificationService.sendToPublisher(userId, {
        title: `Designações Canceladas (${canceledEvents.length})`,
        body: `Você teve ${canceledEvents.length} designações canceladas.`,
        data: { url: "/dashboard" }
      }).catch(err => console.error("Erro ao enviar push:", err))
    }
  }
}

