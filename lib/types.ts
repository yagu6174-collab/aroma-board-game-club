export const LANGS = ["zh", "zh-Hant", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const DOC_NAMES = [
  "home",
  "articles",
  "about",
  "contact",
  "games",
  "events",
] as const;
export type DocName = (typeof DOC_NAMES)[number];

export type HomeDoc = {
  revision: number;
  claim: string;
  en: { claim: string };
};

export type Article = {
  slug: string;
  title: string;
  date: string;
  body: string;
};

export type ArticlesDoc = {
  articles: Article[];
  retiredSlugs: string[];
};

export type RecordItem = {
  period: string;
  title: string;
  detail: string;
};

export type RecordsDoc = {
  items: RecordItem[];
};

export type AboutDoc = {
  prose: string;
  education: RecordItem[];
  career: RecordItem[];
  skills: string[];
};

export type ContactDoc = {
  hint: string;
  email: string;
  wechat: string;
  whatsapp: string;
  instagram: string;
};

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

export function isDocName(value: string): value is DocName {
  return (DOC_NAMES as readonly string[]).includes(value);
}
