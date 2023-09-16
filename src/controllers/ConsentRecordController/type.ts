import { IPublisherConsent } from "../../types/publisherConsent";

export interface BodyConsentRecordCreateTypes {
   publisher: IPublisherConsent
   deviceId?: string
}

export interface BodyCheckConsentRecordTypes {
   fullName: string
   nickname: string
   congregation_id: string
   deviceId: string
   consentDate: Date
}