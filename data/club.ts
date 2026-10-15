import aboutDoc from "@/content/about.json";
import articlesDoc from "@/content/articles.json";
import contactDoc from "@/content/contact.json";
import gamesDoc from "@/content/games.json";
import homeDoc from "@/content/home.json";
import type { Lang } from "@/lib/types";

export type GameKind = "party" | "strategy" | "deduce" | "other";

export type ClubGame = {
  id: string;
  name: string;
  players: string;
  kind: GameKind;
  blurb: string;
  emoji: string;
  action: "play" | "teach";
  borrowable: boolean;
  teachUrl?: string;
  coverUrl?: string;
  showPlay?: boolean;
  showTeach?: boolean;
};

export type ClubLink = {
  text: string;
  href: string;
};

export type ClubSession = {
  name: string;
  signed: number;
  capacity: number;
  placeholder: boolean;
};

export type ClubEvent = {
  id: string;
  group: "club" | "classmate";
  badge: string;
  title: string;
  fee: string;
  feePlaceholder: boolean;
  summary: string;
  body: string;
  time: string;
  place: string;
  emoji: string;
  tint: string;
  placeholder: boolean;
  coverUrl?: string;
  /** Link used only by the sign-up button inside this event’s detail. */
  signupUrl?: string;
  /** ISO start time for the floating “next event” countdown. */
  startsAt?: string;
  sessions: ClubSession[];
};

const ui = {
  navHome: "首页",
  navAbout: "关于我们",
  navGames: "桌游库",
  navNews: "最新消息",
  navJoin: "加入我们",
  signup: "立即报名",
  signupEvent: "立即报名活动",
  learnMore: "了解更多",
  aboutPill: "关于我们",
  gamesPill: "桌游库",
  newsPill: "最新消息",
  gamesLead: "不懂规则？",
  gamesMark: "看这里",
  gamesTail: "！",
  gamesMore: "更多桌游 →",
  gamesSub: "不需要高超的游戏技巧，也不需要刻意找话题。",
  gamesNote: "人数、类型和封面是占位，可替换。「破冰抽题」是这一页里的试玩示例。左右滑，或用两侧按钮翻货架。",
  shelfPrev: "上一盒",
  shelfNext: "下一盒",
  shelfHint: "手机上可以直接左右滑",
  nextLabel: "下一场",
  nextOpen: "查看这场",
  nextDay: "天",
  nextHour: "时",
  nextMin: "分",
  nextSec: "秒",
  nextDismiss: "收起",
  libraryTitle: "所有桌游教学",
  libraryBack: "返回",
  search: "搜索游戏名称…",
  empty: "没有找到这一款。试试别的名字，或换一个类型。",
  filterAll: "全部",
  kindParty: "派对",
  kindStrategy: "策略",
  kindDeduce: "推理阵营",
  kindOther: "其他",
  play: "立即试玩",
  teach: "观看教学",
  borrow: "预约借用",
  newsTitle: "牌桌上的新消息",
  newsAside: "社团局和同学局，分开看。",
  tabClub: "社团活动",
  tabClass: "同学活动",
  sessions: "各场次报名状况",
  countNote: "占位，可替换",
  openEvent: "立即报名 / 详细资料",
  openEnded: "查看回顾",
  endedBar: "已结束 · 可看回顾",
  fee: "费用",
  time: "时间",
  place: "地点",
  joinTitle: "准备好加入我们了吗？",
  joinWa: "加入 WhatsApp",
  joinIg: "Instagram",
  joinForm: "报名表格",
  formMissing: "报名表链接尚未提供，可替换。",
  welcomeTitle: "欢迎来到馨香桌游社",
  welcomeClose: "关闭",
  iceTitle: "话题抽签",
  iceLead: "打破尴尬，认识新朋友",
  iceDraw: "立即抽签",
  iceDrawing: "抽签中…",
  iceAgain: "再抽一次",
  teachSoon: "教学即将放上",
  borrowClear: "目前没有不可预约时段",
  borrowName: "姓名",
  borrowId: "学号",
  borrowPhone: "电话",
  borrowEmail: "邮箱",
  borrowStart: "开始时间",
  borrowEnd: "归还时间",
  borrowNote: "备注",
  borrowOptional: "选填",
  borrowSubmit: "提交预约",
  borrowSaved: "已提交，等待审核。",
  borrowLocal: "这一页只做确认，没有写入后台。",
  needName: "请填写姓名。",
  needId: "请填写学号。",
  needPhone: "请填写电话。",
  badEmail: "邮箱格式还不对。",
  needStart: "请填写开始时间。",
  needEnd: "请填写归还时间。",
  needOrder: "归还时间不能早于开始时间。",
  tooLong: "超过了最长借用天数。",
  close: "关闭",
  menu: "菜单",
  replace: "可替换",
  photo: "社团照片 · 可替换",
  cardReplace: "整张可替换",
  langLine: "语言：普通话 · 简体中文",
};

const englishUi: typeof ui = {
  navHome: "Home",
  navAbout: "About",
  navGames: "Game library",
  navNews: "News",
  navJoin: "Join us",
  signup: "Sign up",
  signupEvent: "Sign up for an event",
  learnMore: "Learn more",
  aboutPill: "About",
  gamesPill: "Game library",
  newsPill: "News",
  gamesLead: "New to the rules? ",
  gamesMark: "Look here",
  gamesTail: "!",
  gamesMore: "More games →",
  gamesSub: "You do not need great skill, and you do not need to hunt for a topic.",
  gamesNote: "Player counts, types, and covers are placeholders and can be replaced. Icebreaker Draw is the playable example. Swipe, or use the side buttons.",
  shelfPrev: "Previous",
  shelfNext: "Next",
  shelfHint: "Swipe sideways on a phone",
  nextLabel: "Next up",
  nextOpen: "See this event",
  nextDay: "d",
  nextHour: "h",
  nextMin: "m",
  nextSec: "s",
  nextDismiss: "Hide",
  libraryTitle: "All game guides",
  libraryBack: "Back",
  search: "Search game names…",
  empty: "Nothing matches. Try another name or type.",
  filterAll: "All",
  kindParty: "Party",
  kindStrategy: "Strategy",
  kindDeduce: "Social deduction",
  kindOther: "Other",
  play: "Play now",
  teach: "Watch a guide",
  borrow: "Reserve a copy",
  newsTitle: "News from the table",
  newsAside: "Club nights and classmate nights, apart.",
  tabClub: "Club events",
  tabClass: "Classmate events",
  sessions: "Sign-ups by session",
  countNote: "Placeholder, replaceable",
  openEvent: "Sign up / details",
  openEnded: "See recap",
  endedBar: "Ended · view recap",
  fee: "Fee",
  time: "Time",
  place: "Place",
  joinTitle: "Ready to join us?",
  joinWa: "Join WhatsApp",
  joinIg: "Instagram",
  joinForm: "Sign-up form",
  formMissing: "The sign-up form link is not set yet. Replaceable.",
  welcomeTitle: "Welcome to Aroma Board Game Club",
  welcomeClose: "Close",
  iceTitle: "Topic draw",
  iceLead: "Skip the awkward pause and meet someone.",
  iceDraw: "Draw now",
  iceDrawing: "Drawing…",
  iceAgain: "Draw again",
  teachSoon: "The guide will be added.",
  borrowClear: "No blocked times right now.",
  borrowName: "Name",
  borrowId: "Student number",
  borrowPhone: "Phone",
  borrowEmail: "Email",
  borrowStart: "Start",
  borrowEnd: "Return",
  borrowNote: "Note",
  borrowOptional: "Optional",
  borrowSubmit: "Submit request",
  borrowSaved: "Submitted. Waiting for review.",
  borrowLocal: "This page only confirms it. Nothing is saved to a server.",
  needName: "Please enter a name.",
  needId: "Please enter a student number.",
  needPhone: "Please enter a phone number.",
  badEmail: "That email does not look right.",
  needStart: "Please enter a start time.",
  needEnd: "Please enter a return time.",
  needOrder: "The return time cannot be earlier than the start.",
  tooLong: "That is longer than the maximum loan.",
  close: "Close",
  menu: "Menu",
  replace: "Replaceable",
  photo: "Club photo · replaceable",
  cardReplace: "Whole card is replaceable",
  langLine: "Language: Mandarin · Simplified Chinese",
};

function gameDetail(title: string) {
  return gamesDoc.items.find((item) => item.title === title)?.detail ?? "";
}

function articleBody(slug: string) {
  return articlesDoc.articles.find((item) => item.slug === slug)?.body ?? "";
}

const digits = contactDoc.whatsapp.replace(/\D/g, "");

export const clubContent = {
  name: "馨香桌游社",
  enName: "Aroma Board Game Club",
  links: {
    email: { text: contactDoc.email, href: contactDoc.email.includes("@") ? `mailto:${contactDoc.email}` : "" },
    wechat: { text: contactDoc.wechat, href: "" },
    whatsapp: { text: "加入 WhatsApp", href: digits ? `https://wa.me/${digits}` : "" },
    instagram: { text: "Instagram", href: contactDoc.instagram },
    form: { text: "报名表格", href: "" },
  },
  signupUrl: "",
  whatsappUrl: digits ? `https://wa.me/${digits}` : "",
  instagramUrl: contactDoc.instagram,
  maxBorrowDays: 7,
  hero: {
    line1: "几张桌子、几盒游戏",
    line2Before: "想",
    line2Mark: "好好享受生活",
    line2After: "的人",
    school: "所属学校或组织",
    intro: homeDoc.claim,
  },
  about: {
    title: "馨香桌游社",
    p1: "馨香桌游社，英文写作 Aroma Board Game Club。馨香对应 Aroma，桌游社对应 Board Game Club。",
    p2: aboutDoc.prose,
    photoUrl: "",
  },
  welcome: homeDoc.claim,
  join: `${aboutDoc.prose}${contactDoc.hint}微信 ${contactDoc.wechat}。邮箱 ${contactDoc.email}。`,
  borrowRules:
    "一款一盒。最长 7 天（占位，可替换）。押金待定（可替换）。提交后只在这一层显示已收到，等待社团审核，不会写入后台。联系 WhatsApp +852 6462 3779，微信 Aroma3779。",
  footer: "2026馨香桌游社",
  topics: [
    "你最近一次笑出声，是因为什么？",
    "如果今晚只能带一盒游戏，你会带哪一盒？",
    "你更想当预言家，还是安静的村民？",
    "用一个词形容你理想的周六下午。",
    "你在牌桌上的幸运物是什么？",
    "新朋友坐到你旁边，你会先递出哪句话？",
    "你赢的时候会沉默，还是会先笑？",
    "香港哪一站下车，你觉得最适合约一局？",
    "你学一个新规则，通常要几分钟才上手？",
    "如果给这张桌子起一个队名，你会叫什么？",
    "你更吃辣，还是更吃甜？",
    "上一次把规则讲给新手听，是哪一款游戏？",
    "你会为了等人，多留一局吗？",
    "闭眼三秒，你现在更想听到洗牌，还是笑声？",
  ],
  games: [
    {
      id: "ice",
      name: "破冰抽题",
      players: "2–12 人",
      kind: "party",
      blurb: "把一个话题抽出来，给刚坐下的人一个开口。不需要高超的游戏技巧，也不需要刻意找话题。",
      emoji: "🎲",
      action: "play",
      borrowable: false,
    },
    {
      id: "wolf",
      name: "狼人杀",
      players: "6–12 人",
      kind: "deduce",
      blurb: `${gameDetail("狼人杀")}资深高手和从未玩过的新朋友，坐在同一张桌子上。`,
      emoji: "🐺",
      action: "teach",
      borrowable: true,
    },
    {
      id: "guandan",
      name: "掼蛋",
      players: "4 人",
      kind: "other",
      blurb: `${gameDetail("掼蛋")}想体验运筹帷幄、算牌算到极致，这里都可以。`,
      emoji: "🃏",
      action: "teach",
      borrowable: true,
    },
    {
      id: "poker",
      name: "德州扑克",
      players: "2–9 人",
      kind: "strategy",
      blurb: `${gameDetail("德州扑克")}想靠「虚张声势」的心理战赢得一桌欢呼，也可以。`,
      emoji: "♠️",
      action: "teach",
      borrowable: true,
    },
    {
      id: "uno",
      name: "UNO",
      players: "2–10 人",
      kind: "party",
      blurb: gameDetail("UNO"),
      emoji: "🎴",
      action: "teach",
      borrowable: true,
    },
    {
      id: "gem",
      name: "宝石商人",
      players: "2–4 人",
      kind: "strategy",
      blurb: `${gameDetail("宝石商人")}第三期牌桌上还有这一盒。`,
      emoji: "💎",
      action: "teach",
      borrowable: true,
    },
    {
      id: "mono",
      name: "大富翁",
      players: "2–6 人",
      kind: "party",
      blurb: `${gameDetail("大富翁")}想轻松就玩派对游戏，怎么开心怎么来。`,
      emoji: "🏠",
      action: "teach",
      borrowable: true,
    },
  ] as ClubGame[],
  featured: ["ice", "wolf", "guandan"],
  events: [
    {
      id: "jul",
      group: "club",
      badge: "7.18",
      title: "馨香桌游社",
      fee: "免费",
      feePlaceholder: false,
      summary: "已结束。鸿图道 22 号俊汇中心 701 室。普通话。免费。",
      body: articleBody("馨香桌游社"),
      time: "2026.7.18（周六）14:00–16:00",
      place: "鸿图道 22 号俊汇中心 701 室",
      emoji: "🌙",
      tint: "from-orange-200 to-amber-100",
      placeholder: false,
      startsAt: "2026-07-18T14:00:00+08:00",
      sessions: [{ name: "周六 14:00–16:00", signed: 12, capacity: 16, placeholder: true }],
    },
    {
      id: "aug",
      group: "club",
      badge: "8.29",
      title: "落日狼人杀",
      fee: "费用未写",
      feePlaceholder: true,
      summary: "已结束。鸿图道 22 号俊汇中心 7 楼。",
      body: articleBody("落日狼人杀"),
      time: "2026.8.29（周六）16:00–18:00",
      place: "鸿图道 22 号俊汇中心 7 楼",
      emoji: "🌅",
      tint: "from-rose-200 to-orange-100",
      placeholder: false,
      startsAt: "2026-08-29T16:00:00+08:00",
      sessions: [{ name: "周六 16:00–18:00", signed: 10, capacity: 14, placeholder: true }],
    },
    {
      id: "oct",
      group: "club",
      badge: "10.24",
      title: "掼蛋与德扑专局",
      fee: "费用未写",
      feePlaceholder: true,
      summary: "尚未举行。鸿图道 22 号俊汇中心 701 室，借用香港圣经教会观塘堂场地。",
      body: articleBody("馨香桌游社-掼蛋与德扑专局"),
      time: "2026.10.24（周六）16:00–18:00",
      place: "鸿图道 22 号俊汇中心 701 室，借用香港圣经教会观塘堂场地",
      emoji: "🃏",
      tint: "from-amber-200 to-yellow-100",
      placeholder: false,
      startsAt: "2026-10-24T16:00:00+08:00",
      sessions: [{ name: "周六 16:00–18:00", signed: 6, capacity: 18, placeholder: true }],
    },
    {
      id: "mate",
      group: "classmate",
      badge: "待定",
      title: "同学活动",
      fee: "费用未写",
      feePlaceholder: true,
      summary: "这一栏留给同学自己发起的局。现在没有具体活动。",
      body: "同学活动还没有资料。标题、日期、费用、场次和封面都可以换掉。",
      time: "时间未写",
      place: "地点未写",
      emoji: "📌",
      tint: "from-slate-200 to-slate-100",
      placeholder: true,
      sessions: [{ name: "场次未写", signed: 0, capacity: 8, placeholder: true }],
    },
  ] as ClubEvent[],
  ui,
};

export type ClubContent = typeof clubContent;

const editableUiKeys = [
  "aboutPill",
  "gamesPill",
  "gamesLead",
  "gamesMark",
  "gamesTail",
  "gamesSub",
  "gamesNote",
  "libraryTitle",
  "newsPill",
  "newsTitle",
  "newsAside",
  "joinTitle",
] as const;

export function presentClub(content: ClubContent, lang: Lang): ClubContent {
  if (lang !== "en") return content;
  const seedHero = clubContent.hero;
  const nextUi = { ...englishUi };
  for (const key of editableUiKeys) {
    if (content.ui[key] !== ui[key]) nextUi[key] = content.ui[key];
  }
  return {
    ...content,
    hero: {
      ...content.hero,
      line1: content.hero.line1 === seedHero.line1 ? "A few tables, a few boxes of games" : content.hero.line1,
      line2Before: content.hero.line2Before === seedHero.line2Before ? "people who want to " : content.hero.line2Before,
      line2Mark: content.hero.line2Mark === seedHero.line2Mark ? "enjoy life" : content.hero.line2Mark,
      line2After: content.hero.line2After === seedHero.line2After ? "" : content.hero.line2After,
      school: "School or organisation",
      intro: content.hero.intro,
    },
    welcome: content.welcome,
    ui: nextUi,
  };
}
