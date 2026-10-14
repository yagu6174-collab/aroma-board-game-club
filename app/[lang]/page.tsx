import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClubHome from "@/components/club/ClubHome";
import { loadClub } from "@/lib/site";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: { absolute: "Aroma Board Game Club" } };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const content = await loadClub(lang);
  return <ClubHome content={content} lang={lang} />;
}
