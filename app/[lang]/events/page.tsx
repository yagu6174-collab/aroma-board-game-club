import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import RecordList from "@/components/RecordList";
import { getChrome } from "@/lib/chrome";
import { readEvents } from "@/lib/content";
import { toTraditionalValue } from "@/lib/traditional";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getChrome(lang).events };
}

export default async function EventsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const chrome = getChrome(lang);
  const doc = await readEvents();
  const items = lang === "zh-Hant" ? toTraditionalValue(doc.items) : doc.items;

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Panel>
        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">{chrome.events}</h1>
        <RecordList items={items} />
      </Panel>
    </main>
  );
}
