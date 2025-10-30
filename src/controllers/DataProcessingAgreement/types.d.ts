export interface BodyAcceptDataProcessingAgreement {
  type: "congregation" | "publisher";
  publisher_id?: string;
  congregation_id?: string;
  deviceId?: string;
  accepted_by_user_id?: string;
}

export interface QueryListDataProcessingAgreement {
  type?: "congregation" | "publisher";
  publisher_id?: string;
  congregation_id?: string;
}
