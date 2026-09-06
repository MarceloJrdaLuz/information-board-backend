export enum MechanicalMeetingType {
    MIDWEEK = "MIDWEEK",
    WEEKEND = "WEEKEND"
}

export enum MechanicalRole {
    ATTENDANT = "ATTENDANT",
    SOUND = "SOUND",
    MEDIA = "MEDIA",
    SOUND_AND_MEDIA = "SOUND_AND_MEDIA",
    ROVING_MIC = "ROVING_MIC",
    STAGE_MIC = "STAGE_MIC"
}

export const MechanicalRoleLabels: Record<MechanicalRole, string> = {
    [MechanicalRole.ATTENDANT]: "Indicador",
    [MechanicalRole.SOUND]: "Som",
    [MechanicalRole.MEDIA]: "Mídias",
    [MechanicalRole.SOUND_AND_MEDIA]: "Som e Mídias",
    [MechanicalRole.ROVING_MIC]: "Microfone Volante",
    [MechanicalRole.STAGE_MIC]: "Pedestal"
};

