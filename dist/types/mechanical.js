"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MechanicalRoleLabels = exports.MechanicalRole = exports.MechanicalMeetingType = void 0;
var MechanicalMeetingType;
(function (MechanicalMeetingType) {
    MechanicalMeetingType["MIDWEEK"] = "MIDWEEK";
    MechanicalMeetingType["WEEKEND"] = "WEEKEND";
})(MechanicalMeetingType = exports.MechanicalMeetingType || (exports.MechanicalMeetingType = {}));
var MechanicalRole;
(function (MechanicalRole) {
    MechanicalRole["ATTENDANT"] = "ATTENDANT";
    MechanicalRole["SOUND"] = "SOUND";
    MechanicalRole["MEDIA"] = "MEDIA";
    MechanicalRole["SOUND_AND_MEDIA"] = "SOUND_AND_MEDIA";
    MechanicalRole["ROVING_MIC"] = "ROVING_MIC";
    MechanicalRole["STAGE_MIC"] = "STAGE_MIC";
})(MechanicalRole = exports.MechanicalRole || (exports.MechanicalRole = {}));
exports.MechanicalRoleLabels = {
    [MechanicalRole.ATTENDANT]: "Indicador",
    [MechanicalRole.SOUND]: "Som",
    [MechanicalRole.MEDIA]: "Mídias",
    [MechanicalRole.SOUND_AND_MEDIA]: "Som e Mídias",
    [MechanicalRole.ROVING_MIC]: "Microfone Volante",
    [MechanicalRole.STAGE_MIC]: "Pedestal"
};
