export interface BodyReportCreateTypes {
    month: string
    year: string
    publisher: {
        fullName: string, 
        nickName: string, 
        congregation_id: string
    }
    publications: number
    videos: number
    hours: number
    revisits: number
    studies: number
    observations: string
}

export type ParamsGetReportsTypes = {
    congregationId: string
}
