import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import RecordList from "@/components/RecordList";
import { getChrome } from "@/lib/chrome";
import { loadClub } from "@/lib/site";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getChrome(lang).games };
}

export default async function GamesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const chrome = getChrome(lang);
  const content = await loadClub(lang);
  const items = content.games.map((game) => ({ period: game.players, title: game.name, detail: game.blurb }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Panel tone="dark">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">{chrome.games}</h1>
        <RecordList items={items} />
      </Panel>
    </main>
  );
}
