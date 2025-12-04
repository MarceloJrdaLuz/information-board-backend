export interface BodyCreateCleaningException {
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface BodyUpdateCleaningException {
  date?: string;
  reason?: string;
}

export type ParamsGetCleaningExceptionByCongregation = {
    congregation_id: string
}

export type ParamsCreateCleaningException = ParamsGetCleaningExceptionByCongregation

export type ParamsGetOneCleaningException = {
    exception_id: string
}

export type ParamsUpdateCleaningException = ParamsGetOneCleaningException

export type ParamsDeleteCleaningException = ParamsGetOneCleaningException