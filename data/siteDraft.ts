import type { ClubContent, GameKind } from "@/data/club";

export type SiteGameDraft = {
  id: string;
  name: string;
  players: string;
  kind: GameKind;
  blurb: string;
  borrowable: boolean;
};

export type SiteSessionDraft = {
  name: string;
  signed: number;
  capacity: number;
};

export type SiteEventDraft = {
  id: string;
  title: string;
  fee: string;
  place: string;
  summary: string;
  body: string;
  time: string;
  startsAt: string;
  sessions: SiteSessionDraft[];
};

export type SiteContactDraft = {
  email: string;
  wechat: string;
  whatsapp: string;
  instagram: string;
  hint: string;
};

export type SiteDraft = {
  revision: 1;
  claim: string;
  about: string;
  games: SiteGameDraft[];
  events: SiteEventDraft[];
  contact: SiteContactDraft;
};

const KINDS: GameKind[] = ["party", "strategy", "deduce", "other"];

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function kindOf(value: unknown, fallback: GameKind): GameKind {
  return KINDS.includes(value as GameKind) ? (value as GameKind) : fallback;
}

function count(value: unknown, fallback: number) {
  const next = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(next) || next < 0) return fallback;
  return Math.round(next);
}

export function siteDraftFrom(content: ClubContent): SiteDraft {
  return {
    revision: 1,
    claim: content.hero.intro,
    about: content.about.p2,
    games: content.games.map((game) => ({
      id: game.id,
      name: game.name,
      players: game.players,
      kind: game.kind,
      blurb: game.blurb,
      borrowable: game.borrowable,
    })),
    events: content.events.map((event) => ({
      id: event.id,
      title: event.title,
      fee: event.fee,
      place: event.place,
      summary: event.summary,
      body: event.body,
      time: event.time,
      startsAt: event.startsAt ?? "",
      sessions: event.sessions.map((session) => ({
        name: session.name,
        signed: session.signed,
        capacity: session.capacity,
      })),
    })),
    contact: { ...content.contact },
  };
}

export function applySiteDraft(base: ClubContent, draft: SiteDraft): ClubContent {
  const games = base.games.map((game) => {
    const next = draft.games.find((item) => item.id === game.id);
    if (!next) return game;
    return {
      ...game,
      name: next.name,
      players: next.players,
      kind: next.kind,
      blurb: next.blurb,
      borrowable: next.borrowable,
    };
  });
  const events = base.events.map((event) => {
    const next = draft.events.find((item) => item.id === event.id);
    if (!next) return event;
    const sessions = (next.sessions.length ? next.sessions : event.sessions).map((session, index) => ({
      name: session.name,
      signed: session.signed,
      capacity: session.capacity,
      placeholder: event.sessions[index]?.placeholder ?? true,
    }));
    return {
      ...event,
      title: next.title,
      fee: next.fee,
      feePlaceholder: next.fee.includes("未写"),
      place: next.place,
      summary: next.summary,
      body: next.body,
      time: next.time,
      startsAt: next.startsAt || undefined,
      sessions,
    };
  });
  const digits = draft.contact.whatsapp.replace(/\D/g, "");
  return {
    ...base,
    whatsappUrl: digits ? `https://wa.me/${digits}` : "",
    instagramUrl: draft.contact.instagram,
    hero: { ...base.hero, intro: draft.claim },
    welcome: draft.claim,
    about: { ...base.about, p2: draft.about },
    join: `${draft.about}${draft.contact.hint}微信 ${draft.contact.wechat}。邮箱 ${draft.contact.email}。`,
    contact: { ...draft.contact },
    games,
    events,
  };
}

export function normalizeSiteDraft(input: unknown, base: ClubContent): SiteDraft {
  const seed = siteDraftFrom(base);
  const raw = asRecord(input);
  const gameRows = Array.isArray(raw.games) ? raw.games : [];
  const eventRows = Array.isArray(raw.events) ? raw.events : [];
  const contact = asRecord(raw.contact);

  return {
    revision: 1,
    claim: text(raw.claim, seed.claim),
    about: text(raw.about, seed.about),
    games: seed.games.map((game) => {
      const row = gameRows.map(asRecord).find((item) => str(item.id) === game.id);
      if (!row) return game;
      return {
        id: game.id,
        name: text(row.name, game.name),
        players: text(row.players, game.players),
        kind: kindOf(row.kind, game.kind),
        blurb: text(row.blurb, game.blurb),
        borrowable: typeof row.borrowable === "boolean" ? row.borrowable : game.borrowable,
      };
    }),
    events: seed.events.map((event) => {
      const row = eventRows.map(asRecord).find((item) => str(item.id) === event.id);
      if (!row) return event;
      const sessionRows = Array.isArray(row.sessions) ? row.sessions : [];
      return {
        id: event.id,
        title: text(row.title, event.title),
        fee: text(row.fee, event.fee),
        place: text(row.place, event.place),
        summary: text(row.summary, event.summary),
        body: text(row.body, event.body),
        time: text(row.time, event.time),
        startsAt: text(row.startsAt, event.startsAt),
        sessions: event.sessions.map((session, index) => {
          const next = asRecord(sessionRows[index]);
          return {
            name: text(next.name, session.name),
            signed: count(next.signed, session.signed),
            capacity: count(next.capacity, session.capacity),
          };
        }),
      };
    }),
    contact: {
      email: text(contact.email, seed.contact.email),
      wechat: text(contact.wechat, seed.contact.wechat),
      whatsapp: text(contact.whatsapp, seed.contact.whatsapp),
      instagram: text(contact.instagram, seed.contact.instagram),
      hint: text(contact.hint, seed.contact.hint),
    },
  };
}
