export interface GlossaryTerm {
  icon: string;
  title: string;
  eng: string;
  oneLiner: string;
  detail: string;
  focus: string;
}

export type GlossaryDatabase = Record<string, GlossaryTerm>;
