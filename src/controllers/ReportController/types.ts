export interface BodyReportCreateTypes {
    month: string
    year: string
    publisher: {
        fullName: string,
        nickName: string,
        congregation_id: string
    }
    hours: number
    studies: number
    observations: string
}
export interface BodyReportCreateManuallyTypes {
    month: string
    year: string
    publisher: {
        fullName: string,
        nickName: string,
        congregation_id: string
        privileges: string[]
    }
    hours: number
    studies: number
    observations: string
}

export interface IUpdateReport {
    report_id: string
    privileges: string[]
}

export interface BodyUpdatePrivilegeTypes {
    reports: IUpdateReport[]
}

export type ParamsGetReportsTypes = {
    congregationId: string
}

export type ParamsDeleteReportypes = {
    report_id: string
}