export interface BodyScheduleCreateMultiple {
  schedule: {
    date: string; // formato YYYY-MM-DD
    slots: {
      time_slot_id: string;
      publishers?: {
        publisher_id: string;
        order?: number;
      }[];
    }[];
  }[];
}

export type ParamsSchedule = {
  arrangement_id: string;
}
