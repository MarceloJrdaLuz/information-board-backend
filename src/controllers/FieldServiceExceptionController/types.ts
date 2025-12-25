/* =====================
   Create
===================== */

export type ParamsCreateFieldServiceException = {
  congregation_id: string;
};

export interface BodyCreateFieldServiceException {
  date: string; // YYYY-MM-DD
  template_id?: string;
  reason?: string;
}

/* =====================
   Get by congregation
===================== */

export type ParamsGetFieldServiceExceptionsByCongregation = {
  congregation_id: string;
};

/* =====================
   Get one
===================== */

export type ParamsGetOneFieldServiceException = {
  exception_id: string;
};

/* =====================
   Update
===================== */

export type ParamsUpdateFieldServiceException = {
  exception_id: string;
};

export interface BodyUpdateFieldServiceException {
  date?: string;
  template_id?: string | null;
  reason?: string | null;
}

/* =====================
   Delete
===================== */

export type ParamsDeleteFieldServiceException = {
  exception_id: string;
};
