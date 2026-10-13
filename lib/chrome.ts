import "server-only";
import type { Chrome } from "@/lib/nav";
import type { Lang } from "@/lib/types";
import { toTraditionalValue } from "@/lib/traditional";

const source = {
  name: "Aroma Board Game Club",
  home: "首页",
  articles: "文章",
  games: "桌游库",
  events: "活动",
  about: "关于",
  contact: "联系",
  chars: "字",
  footer: "2026馨香桌游社",
  email: "邮箱",
  wechat: "微信",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  education: "教育",
  career: "经历",
  skills: "技能",
  menu: "菜单",
};

const english: typeof source = {
  name: "Aroma Board Game Club",
  home: "Home",
  articles: "Articles",
  games: "Game library",
  events: "Events",
  about: "About",
  contact: "Contact",
  chars: "characters",
  footer: "2026馨香桌游社",
  email: "Email",
  wechat: "WeChat",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  education: "Education",
  career: "Career",
  skills: "Skills",
  menu: "Menu",
};

export function getChrome(lang: Lang): Chrome {
  if (lang === "en") return english;
  if (lang === "zh-Hant") return toTraditionalValue(source);
  return source;
}
