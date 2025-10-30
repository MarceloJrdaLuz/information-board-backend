export interface BodyCreateTermsOfUse {
  title: string;
  type: "congregation" | "publisher";
  version: string;
  content: string;
  is_active?: boolean;
}

export type QueryListTermsOfUse = {
  type?: "congregation" | "publisher";
}

export type ParamsGetActiveTermsOfUse = {
  type: "congregation" | "publisher";
}

export type ParamsDeleteTermsOfUse = {
  term_id: string;
}

