export const privilegeENToPT: Record<string, string> = {
    "Publisher": "Publicador",
    "Elder": "Ancião",
    "Ministerial Servant": "Servo Ministerial",
    "Regular Pioneer": "Pioneiro Regular",
    "Special Pioneer": "Pioneiro Especial",
    "Missionary Worldwide": "Missionário em Campo",
    "Continuous Auxiliary Pioneer": "Auxiliar por Tempo Indeterminado",
    "Auxiliary Pioneer": "Pioneiro Auxiliar",
    "Speaker": "Orador",
    "Reader": "Leitor",
    "Chairman": "Presidente",
    "Attendant": "Indicador",
    "Microphone Attendant": "Microfone Volante",
    "Public Witness": "Testemunho Público",
    "Sound": "Som",
    "Media": "Mídias",
    "Sound and Media": "Som e Mídias",
    "Stage": "Pedestal",
    "Stage Attendant": "Pedestal",
    "Field Conductor": "Dirigente de Campo"
}

export const privilegePTtoEN: Record<string, string> = {
    "Publicador": "Publisher",
    "Ancião": "Elder",
    "Servo Ministerial": "Ministerial Servant",
    "Pioneiro Regular": "Regular Pioneer",
    "Pioneiro Especial": "Special Pioneer",
    "Missionário em Campo": "Missionary Worldwide",
    "Missionário": "Missionary Worldwide",
    "Missionario": "Missionary Worldwide",
    "Auxiliar por Tempo Indeterminado": "Continuous Auxiliary Pioneer",
    "Auxiliar Indeterminado": "Continuous Auxiliary Pioneer",
    "Pioneiro Auxiliar": "Auxiliary Pioneer",
    "Orador": "Speaker",
    "Leitor": "Reader",
    "Presidente": "Chairman",
    "Indicador": "Attendant",
    "Microfone Volante": "Microphone Attendant",
    "Dirigente de Campo": "Field Conductor",
    "Testemunho Público": "Public Witness",
    "Som": "Sound",
    "Mídias": "Media",
    "Som e Mídias": "Sound and Media",
    "Pedestal": "Stage Attendant"
}

export function translatePrivilegesPTToEN(privileges: string[]) {
    return privileges.map(p => privilegePTtoEN[p] || p)
}

export function translatePrivilegesENtoPT(privileges: string[]) {
    return privileges.map(p => privilegeENToPT[p] || p)
}

export const MONTH_MAP_PT: Record<string, number> = {
    "janeiro": 0, "fevereiro": 1, "março": 2, "marco": 2, "abril": 3,
    "maio": 4, "junho": 5, "julho": 6, "agosto": 7, "setembro": 8,
    "outubro": 9, "novembro": 10, "dezembro": 11
}

export const PT_MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function getMonthDateRange(monthStr: string, yearStr: string | number): { startDate: string; endDate: string; monthIndex: number } | null {
    const cleanMonth = monthStr.trim().toLowerCase()
    const monthIndex = MONTH_MAP_PT[cleanMonth]
    const year = typeof yearStr === 'number' ? yearStr : parseInt(yearStr.trim(), 10)
    if (monthIndex === undefined || isNaN(year)) return null

    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`
    const startDate = `${year}-${pad(monthIndex + 1)}-01`
    const lastDay = new Date(year, monthIndex + 1, 0).getDate()
    const endDate = `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`
    return { startDate, endDate, monthIndex }
}

export function parsePioneerMonthString(pioneerMonth: string): { startDate: string; endDate: string; monthIndex: number } | null {
    const parts = pioneerMonth.split("-")
    if (parts.length < 2) return null
    return getMonthDateRange(parts[0], parts[1])
}
