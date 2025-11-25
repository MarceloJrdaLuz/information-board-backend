"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translatePrivilegesENtoPT = exports.translatePrivilegesPTToEN = exports.privilegePTtoEN = exports.privilegeENToPT = void 0;
exports.privilegeENToPT = {
    "Publisher": "Publicador",
    "Elder": "Ancião",
    "Ministerial Servant": "Servo Ministerial",
    "Regular Pioneer": "Pioneiro Regular",
    "Continuous Auxiliary Pioneer": "Auxiliar Indeterminado",
    "Auxiliary Pioneer": "Pioneiro Auxiliar",
    "Speaker": "Orador",
    "Reader": "Leitor",
    "Chairman": "Presidente",
    "Attendant": "Indicador",
    "Microphone Attendant": "Microfone Volante",
    "Field Conductor": "Dirigente de Campo"
};
exports.privilegePTtoEN = {
    "Publicador": "Publisher",
    "Ancião": "Elder",
    "Servo Ministerial": "Ministerial Servant",
    "Pioneiro Regular": "Regular Pioneer",
    "Auxiliar Indeterminado": "Continuous Auxiliary Pioneer",
    "Pioneiro Auxiliar": "Auxiliary Pioneer",
    "Orador": "Speaker",
    "Leitor": "Reader",
    "Presidente": "Chairman",
    "Indicador": "Attendant",
    "Dirigente de Campo": "Field Conductor"
};
function translatePrivilegesPTToEN(privileges) {
    return privileges.map(p => exports.privilegePTtoEN[p] || p);
}
exports.translatePrivilegesPTToEN = translatePrivilegesPTToEN;
function translatePrivilegesENtoPT(privileges) {
    return privileges.map(p => exports.privilegeENToPT[p] || p);
}
exports.translatePrivilegesENtoPT = translatePrivilegesENtoPT;
