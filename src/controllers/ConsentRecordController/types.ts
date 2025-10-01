import { IPublisherConsent } from "../../types/publisherConsent";

export interface BodyConsentRecordCreateTypes {
   publisher_id: string
   deviceId?: string
}

export interface BodyCheckConsentRecordTypes {
   publisher_id: string
   deviceId: string
   consentDate: Date
}