/* =====================
   Enums / tipos base
===================== */

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type FieldServiceType = "FIXED" | "ROTATION";

/* =====================
   Create
===================== */

export type ParamsCreateFieldServiceTemplate = {
  congregation_id: string;
};

export interface BodyCreateFieldServiceTemplate {
  weekday: WeekDay;
  time: string;
  location: string;
  type: FieldServiceType;

  // FIXED
  leader_id?: string;

  // ROTATION
  rotation_members?: string[];
}

/* =====================
   Get by congregation
===================== */

export type ParamsGetFieldServiceTemplatesByCongregation = {
  congregation_id: string;
};

/* =====================
   Get one
===================== */

export type ParamsGetOneFieldServiceTemplate = {
  template_id: string;
};

/* =====================
   Update
===================== */

export type ParamsUpdateFieldServiceTemplate = {
  template_id: string;
};

export interface BodyUpdateFieldServiceTemplate {
  weekday?: WeekDay;
  time?: string;
  location?: string;
  active?: boolean;

  leader_id?: string | null;
  rotation_members?: string[];
}

/* =====================
   Delete
===================== */

export type ParamsDeleteFieldServiceTemplate = {
  template_id: string;
};
