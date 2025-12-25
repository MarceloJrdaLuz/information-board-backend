/* =====================
   Create
===================== */

export type ParamsCreateFieldServiceSchedule = {
  template_id: string;
};

export interface BodyCreateFieldServiceSchedule {
  date: string; // YYYY-MM-DD
  leader_id: string;
}

/* =====================
   Get by template
===================== */

export type ParamsGetSchedulesByTemplate = {
  template_id: string;
};

/* =====================
   Get one
===================== */

export type ParamsGetOneFieldServiceSchedule = {
  schedule_id: string;
};

/* =====================
   Update
===================== */

export type ParamsUpdateFieldServiceSchedule = {
  schedule_id: string;
};

export interface BodyUpdateFieldServiceSchedule {
  date?: string;
  leader_id?: string;
}

/* =====================
   Delete
===================== */

export type ParamsDeleteFieldServiceSchedule = {
  schedule_id: string;
};

// controllers/FieldServiceScheduleController/types.ts

export interface FixedFieldServicePdfItem {
  weekday: string
  time: string
  location: string
  leader: string
}

export interface RotationSchedulePdfItem {
  date: string
  leader: string
  exceptionReason?: string
}

export interface RotationBlockPdf {
  title: string
  weekday: number
  time: string
  location: string
  schedules: RotationSchedulePdfItem[]
}

export interface FieldServicePdfResponse {
  congregationName: string
  period: {
    start: string
    end: string
  }
  fixedSchedules: FixedFieldServicePdfItem[]
  rotationBlocks: RotationBlockPdf[]
}
