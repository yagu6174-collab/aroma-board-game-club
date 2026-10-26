import type { ClubContent, ClubLink, GameKind } from "@/data/club";
import { chromeKeys, type ChromeKey } from "@/data/uiChrome";
import { cssColor } from "@/lib/color";
import { finishedEventSummary } from "@/lib/eventStatus";
import { canonicalFormId } from "@/lib/formSync";
import { readStoredOrder, sortByStoredOrder, withOrder } from "@/lib/gameOrder";
import { linksFromJoinButtons, resolveJoinButtons, type JoinButton } from "@/lib/joinButtons";

export type SiteGameDraft = {
  id: string;
  name: string;
  players: string;
  kind: GameKind;
  blurb: string;
  borrowable: boolean;
  emoji: string;
  teachUrl: string;
  coverUrl: string;
  showPlay: boolean;
  showTeach: boolean;
  /** Left-to-right shelf position. 0 is the first card. */
  order: number;
};

export type SiteSessionDraft = {
  name: string;
  signed: number;
  capacity: number;
};

export type SiteEventDraft = {
  id: string;
  group: "club" | "classmate";
  title: string;
  fee: string;
  place: string;
  summary: string;
  body: string;
  time: string;
  startsAt: string;
  emoji: string;
  coverUrl: string;
  signupUrl: string;
  formId: string;
  sessions: SiteSessionDraft[];
};

export type SiteSections = {
  aboutPill: string;
  aboutTitle: string;
  aboutP1: string;
  gamesPill: string;
  gamesLead: string;
  gamesMark: string;
  gamesTail: string;
  gamesSub: string;
  gamesNote: string;
  libraryTitle: string;
  newsPill: string;
  newsTitle: string;
  newsAside: string;
  joinTitle: string;
};

export type SiteHeroLines = {
  line1: string;
  line2Before: string;
  line2Mark: string;
  line2After: string;
};

export type SiteHeroCopy = {
  school: string;
  replaceTag: string;
  langLine: string;
  signup: string;
  signupEvent: string;
  learnMore: string;
};

export type SiteColors = {
  text: string;
  accent: string;
  accentEnd: string;
  body: string;
  meta: string;
};

export type SiteLinksDraft = {
  email: ClubLink;
  wechat: ClubLink;
  whatsapp: ClubLink;
  instagram: ClubLink;
  form: ClubLink;
};

export type SiteChrome = Record<ChromeKey, string>;

export type SiteDraft = {
  revision: 6;
  claim: string;
  about: string;
  join: string;
  footer: string;
  borrowRules: string;
  topics: string[];
  photoUrl: string;
  name: string;
  enName: string;
  logoUrl: string;
  heroLines: SiteHeroLines;
  heroCopy: SiteHeroCopy;
  colors: SiteColors;
  chrome: SiteChrome;
  sections: SiteSections;
  games: SiteGameDraft[];
  events: SiteEventDraft[];
  links: SiteLinksDraft;
  joinButtons: JoinButton[];
};

const KINDS: GameKind[] = ["party", "strategy", "deduce", "other"];
const TINTS = ["from-orange-200 to-amber-100", "from-rose-200 to-orange-100", "from-amber-200 to-yellow-100", "from-sky-200 to-indigo-100"];

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function chromeFrom(content: ClubContent): SiteChrome {
  const chrome = {} as SiteChrome;
  for (const key of chromeKeys) chrome[key] = content.ui[key];
  return chrome;
}

function chromeOf(raw: Record<string, unknown>, seed: SiteChrome): SiteChrome {
  const chrome = {} as SiteChrome;
  for (const key of chromeKeys) chrome[key] = text(raw[key], seed[key]);
  return chrome;
}

function topicsOf(value: unknown, seed: string[]) {
  if (!Array.isArray(value)) return seed;
  return value.map((item) => text(item, "")).filter(Boolean);
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function kindOf(value: unknown, fallback: GameKind): GameKind {
  return KINDS.includes(value as GameKind) ? (value as GameKind) : fallback;
}

function groupOf(value: unknown, fallback: "club" | "classmate"): "club" | "classmate" {
  return value === "classmate" || value === "club" ? value : fallback;
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function count(value: unknown, fallback: number) {
  const next = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(next) || next < 0) return fallback;
  return Math.round(next);
}

function safeId(value: unknown) {
  return str(value).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

function badgeFrom(startsAt: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(startsAt);
  if (!match) return "待定";
  return `${Number(match[2])}.${Number(match[3])}`;
}

function linkOf(value: unknown, fallback: ClubLink): ClubLink {
  if (typeof value === "string") return { text: value.trim() || fallback.text, href: fallback.href };
  const raw = asRecord(value);
  return { text: text(raw.text, fallback.text), href: text(raw.href, fallback.href) };
}

export function siteDraftFrom(content: ClubContent): SiteDraft {
  return {
    revision: 6,
    claim: content.hero.intro,
    about: content.about.p2,
    join: content.join,
    footer: content.footer,
    borrowRules: content.borrowRules,
    topics: [...content.topics],
    photoUrl: content.about.photoUrl,
    name: content.name,
    enName: content.enName,
    logoUrl: content.logoUrl,
    heroLines: {
      line1: content.hero.line1,
      line2Before: content.hero.line2Before,
      line2Mark: content.hero.line2Mark,
      line2After: content.hero.line2After,
    },
    heroCopy: {
      school: content.hero.school,
      replaceTag: content.ui.replace,
      langLine: content.ui.langLine,
      signup: content.ui.signup,
      signupEvent: content.ui.signupEvent,
      learnMore: content.ui.learnMore,
    },
    colors: { ...content.colors },
    chrome: chromeFrom(content),
    sections: {
      aboutPill: content.ui.aboutPill,
      aboutTitle: content.about.title,
      aboutP1: content.about.p1,
      gamesPill: content.ui.gamesPill,
      gamesLead: content.ui.gamesLead,
      gamesMark: content.ui.gamesMark,
      gamesTail: content.ui.gamesTail,
      gamesSub: content.ui.gamesSub,
      gamesNote: content.ui.gamesNote,
      libraryTitle: content.ui.libraryTitle,
      newsPill: content.ui.newsPill,
      newsTitle: content.ui.newsTitle,
      newsAside: content.ui.newsAside,
      joinTitle: content.ui.joinTitle,
    },
    games: withOrder(
      content.games.map((game) => ({
        id: game.id,
        name: game.name,
        players: game.players,
        kind: game.kind,
        blurb: game.blurb,
        borrowable: game.borrowable,
        emoji: game.emoji,
        teachUrl: game.teachUrl ?? "",
        coverUrl: game.coverUrl ?? "",
        showPlay: game.showPlay ?? game.action === "play",
        showTeach: game.showTeach ?? game.action !== "play",
      })),
    ),
    events: content.events.map((event) => ({
      id: event.id,
      group: event.group,
      title: event.title,
      fee: event.fee,
      place: event.place,
      summary: event.summary,
      body: event.body,
      time: event.time,
      startsAt: event.startsAt ?? "",
      emoji: event.emoji,
      coverUrl: event.coverUrl ?? "",
      signupUrl: event.signupUrl ?? "",
      formId: "",
      sessions: event.sessions.map((session) => ({
        name: session.name,
        signed: session.signed,
        capacity: session.capacity,
      })),
    })),
    links: linksFromJoinButtons(content.joinButtons),
    joinButtons: content.joinButtons.map((button) => ({ ...button })),
  };
}

export function applySiteDraft(base: ClubContent, draft: SiteDraft): ClubContent {
  const games = sortByStoredOrder(draft.games).map((next) => {
    const seed = base.games.find((item) => item.id === next.id);
    return {
      id: next.id,
      name: next.name,
      players: next.players,
      kind: next.kind,
      blurb: next.blurb,
      emoji: next.emoji || seed?.emoji || "🎲",
      action: (next.showPlay && !next.showTeach ? "play" : "teach") as "play" | "teach",
      borrowable: next.borrowable,
      teachUrl: next.teachUrl,
      coverUrl: next.coverUrl,
      showPlay: next.showPlay,
      showTeach: next.showTeach,
    };
  });
  const events = draft.events.map((next, index) => {
    const seed = base.events.find((item) => item.id === next.id);
    return {
      id: next.id,
      group: next.group,
      badge: badgeFrom(next.startsAt),
      title: next.title,
      fee: next.fee,
      feePlaceholder: next.fee.includes("未写"),
      summary: finishedEventSummary(next.summary, next.startsAt || undefined),
      body: next.body,
      time: next.time,
      place: next.place,
      emoji: next.emoji || seed?.emoji || "🎲",
      coverUrl: next.coverUrl,
      signupUrl: next.signupUrl,
      tint: seed?.tint ?? TINTS[index % TINTS.length]!,
      placeholder: false,
      startsAt: next.startsAt || undefined,
      sessions: next.sessions.map((session) => ({
        name: session.name,
        signed: session.signed,
        capacity: session.capacity,
        placeholder: false,
      })),
    };
  });
  const links = linksFromJoinButtons(draft.joinButtons);
  return {
    ...base,
    whatsappUrl: links.whatsapp.href,
    instagramUrl: links.instagram.href,
    signupUrl: links.form.href,
    links,
    joinButtons: draft.joinButtons.map((button) => ({ ...button })),
    name: draft.name,
    enName: draft.enName,
    logoUrl: draft.logoUrl,
    colors: { ...draft.colors },
    hero: { ...base.hero, ...draft.heroLines, school: draft.heroCopy.school, intro: draft.claim },
    welcome: draft.claim,
    about: { ...base.about, title: draft.sections.aboutTitle, p1: draft.sections.aboutP1, p2: draft.about, photoUrl: draft.photoUrl },
    join: draft.join,
    footer: draft.footer,
    borrowRules: draft.borrowRules,
    topics: draft.topics,
    ui: {
      ...base.ui,
      aboutPill: draft.sections.aboutPill,
      gamesPill: draft.sections.gamesPill,
      gamesLead: draft.sections.gamesLead,
      gamesMark: draft.sections.gamesMark,
      gamesTail: draft.sections.gamesTail,
      gamesSub: draft.sections.gamesSub,
      gamesNote: draft.sections.gamesNote,
      libraryTitle: draft.sections.libraryTitle,
      newsPill: draft.sections.newsPill,
      newsTitle: draft.sections.newsTitle,
      newsAside: draft.sections.newsAside,
      joinTitle: draft.sections.joinTitle,
      replace: draft.heroCopy.replaceTag,
      langLine: draft.heroCopy.langLine,
      signup: draft.heroCopy.signup,
      signupEvent: draft.heroCopy.signupEvent,
      learnMore: draft.heroCopy.learnMore,
      ...draft.chrome,
    },
    games,
    events,
  };
}

export function normalizeSiteDraft(input: unknown, base: ClubContent): SiteDraft {
  const seed = siteDraftFrom(base);
  const raw = asRecord(input);
  const gameRows = Array.isArray(raw.games) ? raw.games : null;
  const eventRows = Array.isArray(raw.events) ? raw.events : null;
  const contact = asRecord(raw.contact);
  const linksRaw = asRecord(raw.links);

  const sectionsRaw = asRecord(raw.sections);
  const heroRaw = asRecord(raw.heroLines);
  const heroCopyRaw = asRecord(raw.heroCopy);
  const colorsRaw = asRecord(raw.colors);
  const chromeRaw = asRecord(raw.chrome);
  const linksInput = normalizeLinks(linksRaw, contact, seed.links);
  const joinButtons = resolveJoinButtons(raw.joinButtons, linksInput);
  const links = linksFromJoinButtons(joinButtons);
  return {
    revision: 6,
    claim: text(raw.claim, seed.claim),
    about: text(raw.about, seed.about),
    join: text(raw.join, seed.join),
    footer: text(raw.footer, seed.footer),
    borrowRules: text(raw.borrowRules, seed.borrowRules),
    topics: topicsOf(raw.topics, seed.topics),
    photoUrl: text(raw.photoUrl, seed.photoUrl),
    name: text(raw.name, seed.name),
    enName: text(raw.enName, seed.enName),
    logoUrl: text(raw.logoUrl, seed.logoUrl),
    heroLines: {
      line1: text(heroRaw.line1, seed.heroLines.line1),
      line2Before: text(heroRaw.line2Before, seed.heroLines.line2Before),
      line2Mark: text(heroRaw.line2Mark, seed.heroLines.line2Mark),
      line2After: text(heroRaw.line2After, seed.heroLines.line2After),
    },
    heroCopy: {
      school: text(heroCopyRaw.school, seed.heroCopy.school),
      replaceTag: text(heroCopyRaw.replaceTag, seed.heroCopy.replaceTag),
      langLine: text(heroCopyRaw.langLine, seed.heroCopy.langLine),
      signup: text(heroCopyRaw.signup, seed.heroCopy.signup),
      signupEvent: text(heroCopyRaw.signupEvent, seed.heroCopy.signupEvent),
      learnMore: text(heroCopyRaw.learnMore, seed.heroCopy.learnMore),
    },
    colors: {
      text: cssColor(colorsRaw.text, seed.colors.text),
      accent: cssColor(colorsRaw.accent, seed.colors.accent),
      accentEnd: cssColor(colorsRaw.accentEnd, seed.colors.accentEnd),
      body: cssColor(colorsRaw.body, seed.colors.body),
      meta: cssColor(colorsRaw.meta, seed.colors.meta),
    },
    chrome: chromeOf(chromeRaw, seed.chrome),
    sections: {
      aboutPill: text(sectionsRaw.aboutPill, seed.sections.aboutPill),
      aboutTitle: text(sectionsRaw.aboutTitle, seed.sections.aboutTitle),
      aboutP1: text(sectionsRaw.aboutP1, seed.sections.aboutP1),
      gamesPill: text(sectionsRaw.gamesPill, seed.sections.gamesPill),
      gamesLead: text(sectionsRaw.gamesLead, seed.sections.gamesLead),
      gamesMark: text(sectionsRaw.gamesMark, seed.sections.gamesMark),
      gamesTail: text(sectionsRaw.gamesTail, seed.sections.gamesTail),
      gamesSub: text(sectionsRaw.gamesSub, seed.sections.gamesSub),
      gamesNote: text(sectionsRaw.gamesNote, seed.sections.gamesNote),
      libraryTitle: text(sectionsRaw.libraryTitle, seed.sections.libraryTitle),
      newsPill: text(sectionsRaw.newsPill, seed.sections.newsPill),
      newsTitle: text(sectionsRaw.newsTitle, seed.sections.newsTitle),
      newsAside: text(sectionsRaw.newsAside, seed.sections.newsAside),
      joinTitle: text(sectionsRaw.joinTitle, seed.sections.joinTitle),
    },
    games: gameRows ? normalizeGames(gameRows, seed.games) : seed.games,
    events: eventRows ? normalizeEvents(eventRows, seed.events) : seed.events,
    links,
    joinButtons,
  };
}

function normalizeGames(rows: unknown[], seed: SiteGameDraft[]) {
  const used = new Set<string>();
  const games: Array<Omit<SiteGameDraft, "order"> & { order?: number }> = [];
  for (const item of rows) {
    const raw = asRecord(item);
    const id = safeId(raw.id);
    if (!id || used.has(id)) continue;
    used.add(id);
    const known = seed.find((game) => game.id === id);
    games.push({
      id,
      name: text(raw.name, known?.name ?? "新桌游"),
      players: text(raw.players, known?.players ?? ""),
      kind: kindOf(raw.kind, known?.kind ?? "other"),
      blurb: text(raw.blurb, known?.blurb ?? ""),
      borrowable: typeof raw.borrowable === "boolean" ? raw.borrowable : (known?.borrowable ?? false),
      emoji: text(raw.emoji, known?.emoji ?? "🎲"),
      teachUrl: text(raw.teachUrl, known?.teachUrl ?? ""),
      coverUrl: text(raw.coverUrl, known?.coverUrl ?? ""),
      showPlay: flag(raw.showPlay, known?.showPlay ?? false),
      showTeach: flag(raw.showTeach, known?.showTeach ?? true),
      order: readStoredOrder(raw.order),
    });
  }
  return sortByStoredOrder(games);
}

function normalizeEvents(rows: unknown[], seed: SiteEventDraft[]) {
  const used = new Set<string>();
  const events: SiteEventDraft[] = [];
  for (const item of rows) {
    const raw = asRecord(item);
    const id = safeId(raw.id);
    if (!id || used.has(id)) continue;
    used.add(id);
    const known = seed.find((event) => event.id === id);
    const sessionRows = Array.isArray(raw.sessions) ? raw.sessions : null;
    const startsAt = text(raw.startsAt, known?.startsAt ?? "");
    events.push({
      id,
      group: groupOf(raw.group, known?.group ?? "club"),
      title: text(raw.title, known?.title ?? "新活动"),
      fee: text(raw.fee, known?.fee ?? ""),
      place: text(raw.place, known?.place ?? ""),
      summary: finishedEventSummary(text(raw.summary, known?.summary ?? ""), startsAt),
      body: text(raw.body, known?.body ?? ""),
      time: text(raw.time, known?.time ?? ""),
      startsAt,
      emoji: text(raw.emoji, known?.emoji ?? "🎲"),
      coverUrl: text(raw.coverUrl, known?.coverUrl ?? ""),
      signupUrl: text(raw.signupUrl, known?.signupUrl ?? ""),
      formId: canonicalFormId(text(raw.formId, known?.formId ?? "")),
      sessions: sessionRows ? normalizeSessions(sessionRows) : (known?.sessions ?? []),
    });
  }
  return events;
}

function normalizeSessions(rows: unknown[]): SiteSessionDraft[] {
  return rows.map((item) => {
    const raw = asRecord(item);
    return {
      name: text(raw.name, "场次"),
      signed: count(raw.signed, 0),
      capacity: count(raw.capacity, 0),
    };
  });
}

function normalizeLinks(linksRaw: Record<string, unknown>, legacy: Record<string, unknown>, seed: SiteLinksDraft): SiteLinksDraft {
  if (Object.keys(linksRaw).length) {
    return {
      email: linkOf(linksRaw.email, seed.email),
      wechat: linkOf(linksRaw.wechat, seed.wechat),
      whatsapp: linkOf(linksRaw.whatsapp, seed.whatsapp),
      instagram: linkOf(linksRaw.instagram, seed.instagram),
      form: linkOf(linksRaw.form, seed.form),
    };
  }
  const whatsapp = str(legacy.whatsapp);
  const instagram = str(legacy.instagram);
  const email = str(legacy.email);
  const digits = whatsapp.replace(/\D/g, "");
  return {
    email: { text: email || seed.email.text, href: email.includes("@") ? `mailto:${email}` : seed.email.href },
    wechat: { text: str(legacy.wechat) || seed.wechat.text, href: seed.wechat.href },
    whatsapp: {
      text: seed.whatsapp.text,
      href: whatsapp.startsWith("http") ? whatsapp : digits ? `https://wa.me/${digits}` : seed.whatsapp.href,
    },
    instagram: { text: seed.instagram.text, href: instagram || seed.instagram.href },
    form: seed.form,
  };
}
