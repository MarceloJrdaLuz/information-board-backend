export type ParamsPublisherReminderTypes = {
  publisher_id: string
}

export type ParamsReminderTypes = {
  reminder_id: string
}

// BODY - CREATE

export interface BodyReminderCreateTypes {
  title: string
  description?: string

  startDate: string
  endDate?: string

  isRecurring?: boolean
  recurrenceIntervalDays?: number
  recurrenceCount?: number
}

export interface BodyReminderUpdateTypes {
  title?: string
  description?: string

  startDate?: string
  endDate?: string

  isRecurring?: boolean
  recurrenceIntervalDays?: number
  recurrenceCount?: number
  isActive?: boolean
}
