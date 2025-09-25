export const privilegeENToPT: Record<string, string> = {
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
    "Microphone Attendant": "Microfone Volante"
}

export const privilegePTtoEN: Record<string, string> = {
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
    "Microfone Volante": "Microphone Attendant"
}

export function translatePrivilegesPTToEN(privileges: string[]) {
    return privileges.map(p => privilegePTtoEN[p] || p)
}

export function translatePrivilegesENtoPT(privileges: string[]) {
    return privileges.map(p => privilegeENToPT[p] || p)
}

