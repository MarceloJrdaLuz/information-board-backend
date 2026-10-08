import { Publisher } from "../entities/Publisher"
import { PublisherPrivilege } from "../entities/PublisherPrivilege"
import { PrivilegeCode } from "../types/privileges"

/**
 * Checks if a PublisherPrivilege record is active at a given date.
 * If targetDate is omitted, current date is used.
 */
export function isPrivilegeActiveAt(
    pp: PublisherPrivilege,
    targetDate: Date = new Date()
): boolean {
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)

    const isAux =
        pp.privilege?.code === PrivilegeCode.AUXILIARY_PIONEER ||
        pp.privilege?.name === "Auxiliary Pioneer" ||
        pp.privilege?.name === "Pioneiro Auxiliar"

    if (isAux && !pp.endDate) {
        if (!pp.startDate) return false
        const start = new Date(pp.startDate)
        if (
            target.getFullYear() !== start.getFullYear() ||
            target.getMonth() !== start.getMonth()
        ) {
            return false
        }
    }

    if (pp.startDate) {
        const start = new Date(pp.startDate)
        start.setHours(0, 0, 0, 0)
        if (target < start) return false
    }

    if (pp.endDate) {
        const end = new Date(pp.endDate)
        end.setHours(23, 59, 59, 999)
        if (target > end) return false
    }

    return true
}

/**
 * Maps a PrivilegeCode to equivalent English and Portuguese names for resilient fallback.
 */
const codeToNamesMap: Record<PrivilegeCode, { en: string; pt: string }> = {
    [PrivilegeCode.PUBLISHER]: { en: "Publisher", pt: "Publicador" },
    [PrivilegeCode.ELDER]: { en: "Elder", pt: "Ancião" },
    [PrivilegeCode.MINISTERIAL_SERVANT]: { en: "Ministerial Servant", pt: "Servo Ministerial" },
    [PrivilegeCode.REGULAR_PIONEER]: { en: "Regular Pioneer", pt: "Pioneiro Regular" },
    [PrivilegeCode.SPECIAL_PIONEER]: { en: "Special Pioneer", pt: "Pioneiro Especial" },
    [PrivilegeCode.MISSIONARY_WORLDWIDE]: { en: "Missionary Worldwide", pt: "Missionário em Campo" },
    [PrivilegeCode.CONTINUOUS_AUXILIARY_PIONEER]: { en: "Continuous Auxiliary Pioneer", pt: "Auxiliar por Tempo Indeterminado" },
    [PrivilegeCode.AUXILIARY_PIONEER]: { en: "Auxiliary Pioneer", pt: "Pioneiro Auxiliar" },
    [PrivilegeCode.SPEAKER]: { en: "Speaker", pt: "Orador" },
    [PrivilegeCode.READER]: { en: "Reader", pt: "Leitor" },
    [PrivilegeCode.CHAIRMAN]: { en: "Chairman", pt: "Presidente" },
    [PrivilegeCode.ATTENDANT]: { en: "Attendant", pt: "Indicador" },
    [PrivilegeCode.MICROPHONE_ATTENDANT]: { en: "Microphone Attendant", pt: "Microfone Volante" },
    [PrivilegeCode.FIELD_CONDUCTOR]: { en: "Field Conductor", pt: "Dirigente de Campo" },
    [PrivilegeCode.PUBLIC_WITNESS]: { en: "Public Witness", pt: "Testemunho Público" },
    [PrivilegeCode.SOUND]: { en: "Sound", pt: "Som" },
    [PrivilegeCode.MEDIA]: { en: "Media", pt: "Mídias" },
    [PrivilegeCode.SOUND_AND_MEDIA]: { en: "Sound and Media", pt: "Som e Mídias" },
    [PrivilegeCode.STAGE_ATTENDANT]: { en: "Stage Attendant", pt: "Pedestal" }
}

/**
 * Returns true if the publisher has the specified privilege active at the target date.
 */
export function hasPrivilege(
    publisher: Partial<Publisher> | null | undefined,
    code: PrivilegeCode,
    targetDate: Date = new Date()
): boolean {
    if (!publisher) return false

    // Primary check: relational entity with active dates
    if (publisher.privilegesRelation && Array.isArray(publisher.privilegesRelation) && publisher.privilegesRelation.length > 0) {
        const matchingRecords = publisher.privilegesRelation.filter(pp => {
            if (!pp.privilege) return false
            const matchCode = pp.privilege.code === code
            const names = codeToNamesMap[code]
            const matchName = names && (pp.privilege.name === names.en || pp.privilege.name === names.pt)
            return matchCode || matchName
        })

        if (matchingRecords.length > 0) {
            return matchingRecords.some(pp => isPrivilegeActiveAt(pp, targetDate))
        }
    }

    // Fallback: check publisher.privileges string array
    if (publisher.privileges && Array.isArray(publisher.privileges)) {
        if (code === PrivilegeCode.AUXILIARY_PIONEER) {
            return false
        }
        const names = codeToNamesMap[code]
        return publisher.privileges.some(p => 
            p === code || 
            (names && (p === names.en || p === names.pt))
        )
    }

    return false
}

/**
 * Checks if publisher has ANY of the specified privilege codes active.
 */
export function hasAnyPrivilege(
    publisher: Partial<Publisher> | null | undefined,
    codes: PrivilegeCode[],
    targetDate: Date = new Date()
): boolean {
    return codes.some(code => hasPrivilege(publisher, code, targetDate))
}

/**
 * Returns list of PublisherPrivilege records active at target date.
 */
export function getActivePrivileges(
    publisher: Partial<Publisher> | null | undefined,
    targetDate: Date = new Date()
): PublisherPrivilege[] {
    if (!publisher?.privilegesRelation || !Array.isArray(publisher.privilegesRelation)) {
        return []
    }
    return publisher.privilegesRelation.filter(pp => isPrivilegeActiveAt(pp, targetDate))
}

/**
 * Returns list of active PrivilegeCodes for the publisher at target date.
 */
export function getActivePrivilegeCodes(
    publisher: Partial<Publisher> | null | undefined,
    targetDate: Date = new Date()
): PrivilegeCode[] {
    const activePP = getActivePrivileges(publisher, targetDate)
    const codes: PrivilegeCode[] = []

    for (const pp of activePP) {
        if (pp.privilege?.code && Object.values(PrivilegeCode).includes(pp.privilege.code as PrivilegeCode)) {
            codes.push(pp.privilege.code as PrivilegeCode)
        }
    }

    return Array.from(new Set(codes))
}

/**
 * Returns active privilege names in Portuguese for snapshotting in reports.
 */
export function getActivePrivilegeNamesPT(
    publisher: Partial<Publisher> | null | undefined,
    targetDate: Date = new Date()
): string[] {
    const activePP = getActivePrivileges(publisher, targetDate)
    const names: string[] = []

    for (const pp of activePP) {
        if (pp.privilege) {
            const code = pp.privilege.code as PrivilegeCode
            const mapped = code && codeToNamesMap[code]
            if (mapped) {
                names.push(mapped.pt)
            } else if (pp.privilege.name) {
                names.push(pp.privilege.name)
            }
        }
    }

    return Array.from(new Set(names))
}

