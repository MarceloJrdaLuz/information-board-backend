export type ParamsUpsertTemplateLocations = {
    template_id: string;
}

export interface BodyUpsertTemplateLocations {
    weeks: {
        date: string;      // qualquer data da semana
        location: string;
    }[], 
    clear_all?: boolean
}
