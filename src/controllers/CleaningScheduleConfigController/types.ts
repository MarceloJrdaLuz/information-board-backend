import { CleaningScheduleMode } from "../../types/cleaning";

export type ParamsConfigCreate = {
    congregation_id: string;
};

export type BodyConfigCreate = {
    mode: CleaningScheduleMode;
};

export type ParamsConfigUpdate = {
    config_id: string;
};

export type BodyConfigUpdate = {
    mode: CleaningScheduleMode;
};

export type ParamsGetCongregationConfig = {
    congregation_id: string;
};
