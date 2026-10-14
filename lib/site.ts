import "server-only";
import { clubContent, presentClub, type ClubContent } from "@/data/club";
import { applySiteDraft, normalizeSiteDraft, siteDraftFrom, type SiteDraft } from "@/data/siteDraft";
import { readStored, writeStored } from "@/lib/store";
import { toTraditionalValue } from "@/lib/traditional";
import type { Lang } from "@/lib/types";

const KEY = "site";

export async function readSiteDraft(): Promise<SiteDraft> {
  const stored = await readStored(KEY);
  if (!stored) return siteDraftFrom(clubContent);
  return normalizeSiteDraft(stored, clubContent);
}

export async function saveSiteDraft(input: unknown): Promise<SiteDraft> {
  const draft = normalizeSiteDraft(input, clubContent);
  await writeStored(KEY, draft);
  return draft;
}

export async function loadClub(lang: Lang): Promise<ClubContent> {
  const draft = await readSiteDraft();
  const merged = applySiteDraft(clubContent, draft);
  const localized = lang === "zh-Hant" ? toTraditionalValue(merged) : merged;
  return presentClub(localized, lang);
}
