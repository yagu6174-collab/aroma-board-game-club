import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import { getChrome } from "@/lib/chrome";
import { loadClub } from "@/lib/site";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getChrome(lang).about };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [content, chrome] = await Promise.all([loadClub(lang), Promise.resolve(getChrome(lang))]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Panel>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{chrome.about}</h1>
        <p className="mt-8 whitespace-pre-line text-[#3d4656]">{content.about.p1}</p>
        <p className="mt-4 whitespace-pre-line text-[#3d4656]">{content.about.p2}</p>
      </Panel>
    </main>
  );
}
