import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClubHome from "@/components/club/ClubHome";
import { clubContent, presentClub } from "@/data/club";
import { toTraditionalValue } from "@/lib/traditional";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: { absolute: "Aroma Board Game Club" } };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const content = presentClub(lang === "zh-Hant" ? toTraditionalValue(clubContent) : clubContent, lang);
  return <ClubHome content={content} lang={lang} />;
}
