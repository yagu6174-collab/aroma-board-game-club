export const NAV = [
  ["home", ""],
  ["articles", "/articles"],
  ["games", "/games"],
  ["events", "/events"],
  ["about", "/about"],
  ["contact", "/contact"],
] as const;

export type NavKey = (typeof NAV)[number][0];

export type Chrome = {
  name: string;
  home: string;
  articles: string;
  games: string;
  events: string;
  about: string;
  contact: string;
  chars: string;
  footer: string;
  email: string;
  wechat: string;
  whatsapp: string;
  instagram: string;
  education: string;
  career: string;
  skills: string;
  menu: string;
};
