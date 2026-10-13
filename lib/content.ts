import "server-only";
import homeSeedJson from "@/content/home.json";
import aboutSeedJson from "@/content/about.json";
import contactSeedJson from "@/content/contact.json";
import gamesSeedJson from "@/content/games.json";
import eventsSeedJson from "@/content/events.json";
import articlesSeedJson from "@/content/articles.json";
import { readStored, writeStored } from "@/lib/store";
import { normalizeSlug } from "@/lib/slug";
import { translateZhToEn } from "@/lib/translate";
import type {
  AboutDoc,
  Article,
  ArticlesDoc,
  ContactDoc,
  DocName,
  HomeDoc,
  RecordItem,
  RecordsDoc,
} from "@/lib/types";

export const HOME_REVISION = 1;

const homeSeed = homeSeedJson as HomeDoc;
const aboutSeed = aboutSeedJson as AboutDoc;
const contactSeed = contactSeedJson as ContactDoc;
const gamesSeed = gamesSeedJson as RecordsDoc;
const eventsSeed = eventsSeedJson as RecordsDoc;
const articlesSeed = articlesSeedJson as ArticlesDoc;

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function recordItem(value: unknown): RecordItem | null {
  const raw = asRecord(value);
  const item = {
    period: str(raw.period),
    title: str(raw.title),
    detail: str(raw.detail),
  };
  if (!item.period && !item.title && !item.detail) return null;
  return item;
}

function recordList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(recordItem).filter((item): item is RecordItem => item !== null);
}

export function normalizeHome(input: unknown, enClaim?: string): HomeDoc {
  const raw = asRecord(input);
  const en = asRecord(raw.en);
  return {
    revision: HOME_REVISION,
    claim: str(raw.claim),
    en: { claim: enClaim ?? str(en.claim) },
  };
}

function revisionOk(value: unknown): value is HomeDoc {
  const raw = asRecord(value);
  return typeof raw.revision === "number" && raw.revision >= HOME_REVISION;
}

export function normalizeAbout(input: unknown): AboutDoc {
  const raw = asRecord(input);
  const skills = Array.isArray(raw.skills)
    ? raw.skills.map(str).filter(Boolean)
    : [];
  return {
    prose: str(raw.prose),
    education: recordList(raw.education),
    career: recordList(raw.career),
    skills,
  };
}

export function normalizeContact(input: unknown): ContactDoc {
  const raw = asRecord(input);
  return {
    hint: str(raw.hint),
    email: str(raw.email),
    wechat: str(raw.wechat),
    whatsapp: str(raw.whatsapp),
    instagram: str(raw.instagram),
  };
}

export function normalizeRecords(input: unknown): RecordsDoc {
  const raw = asRecord(input);
  return { items: recordList(raw.items) };
}

function allocateSlug(preferred: string, used: Set<string>, retired: Set<string>) {
  const base = preferred.normalize("NFC").trim() || "未命名";
  if (!used.has(base) && !retired.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`) || retired.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function normalizeArticles(input: unknown, previous: ArticlesDoc): ArticlesDoc {
  const raw = asRecord(input);
  const rows = Array.isArray(raw.articles) ? raw.articles : [];
  const incomingRetired = Array.isArray(raw.retiredSlugs)
    ? raw.retiredSlugs.map((item) => normalizeSlug(str(item)))
    : [];
  const retired = new Set([...previous.retiredSlugs.map(normalizeSlug), ...incomingRetired]);
  const previousSlugs = new Set(previous.articles.map((item) => normalizeSlug(item.slug)));
  const used = new Set<string>();
  const articles: Article[] = [];

  for (const row of rows) {
    const item = asRecord(row);
    const title = str(item.title);
    const body = str(item.body);
    const date = str(item.date);
    if (!title && !body && !date) continue;
    const preferred = str(item.slug) || title || "未命名";
    const slug = allocateSlug(normalizeSlug(preferred), used, retired);
    used.add(slug);
    articles.push({
      slug,
      title: title || "未命名",
      date,
      body,
    });
  }

  for (const slug of previousSlugs) {
    if (!used.has(slug)) retired.add(slug);
  }

  return { articles, retiredSlugs: [...retired] };
}

async function readHomeStored() {
  const stored = await readStored("home");
  if (!revisionOk(stored)) return null;
  return normalizeHome(stored);
}

export async function readHome() {
  const stored = await readHomeStored();
  if (stored) return stored;
  return normalizeHome(homeSeed);
}

export async function readAbout() {
  const stored = await readStored("about");
  return normalizeAbout(stored ?? aboutSeed);
}

export async function readContact() {
  const stored = await readStored("contact");
  return normalizeContact(stored ?? contactSeed);
}

export async function readGames() {
  const stored = await readStored("games");
  return normalizeRecords(stored ?? gamesSeed);
}

export async function readEvents() {
  const stored = await readStored("events");
  return normalizeRecords(stored ?? eventsSeed);
}

export async function readArticles() {
  const stored = await readStored("articles");
  const previous = {
    articles: [] as ArticlesDoc["articles"],
    retiredSlugs: articlesSeed.retiredSlugs,
  };
  const doc = normalizeArticles(stored ?? articlesSeed, previous);
  const retired = new Set(doc.retiredSlugs.map(normalizeSlug));
  return {
    retiredSlugs: doc.retiredSlugs,
    articles: doc.articles.filter((item) => !retired.has(normalizeSlug(item.slug))),
  };
}

export async function saveDoc(name: DocName, input: unknown) {
  if (name === "home") {
    const previous = await readHome();
    const next = normalizeHome(input);
    let enClaim = previous.en.claim;
    if (next.claim !== previous.claim || !enClaim) {
      try {
        const translated = await translateZhToEn(next.claim);
        if (translated) enClaim = translated;
      } catch {
        enClaim = previous.en.claim;
      }
    }
    const doc = normalizeHome(next, enClaim);
    await writeStored("home", doc);
    return doc;
  }
  if (name === "articles") {
    const previous = await readArticles();
    const doc = normalizeArticles(input, previous);
    await writeStored("articles", doc);
    return doc;
  }
  if (name === "about") {
    const doc = normalizeAbout(input);
    await writeStored("about", doc);
    return doc;
  }
  if (name === "contact") {
    const doc = normalizeContact(input);
    await writeStored("contact", doc);
    return doc;
  }
  if (name === "games") {
    const doc = normalizeRecords(input);
    await writeStored("games", doc);
    return doc;
  }
  const doc = normalizeRecords(input);
  await writeStored("events", doc);
  return doc;
}

export async function readDoc(name: DocName) {
  if (name === "home") return readHome();
  if (name === "articles") return readArticles();
  if (name === "about") return readAbout();
  if (name === "contact") return readContact();
  if (name === "games") return readGames();
  return readEvents();
}
