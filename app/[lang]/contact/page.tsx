import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import { getChrome } from "@/lib/chrome";
import { loadClub } from "@/lib/site";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getChrome(lang).contact };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [content, chrome] = await Promise.all([loadClub(lang), Promise.resolve(getChrome(lang))]);
  const rows = [
    { label: chrome.email, ...content.links.email },
    { label: chrome.wechat, ...content.links.wechat },
    { label: chrome.whatsapp, ...content.links.whatsapp },
    { label: chrome.instagram, ...content.links.instagram },
  ].filter((row) => row.text);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Panel>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{chrome.contact}</h1>
        <ul className="mt-8">
          {rows.map((row) => (
            <li key={row.label} className="border-t border-current/15 py-4">
              <p className="text-sm text-[#8b93a7]">{row.label}</p>
              {row.href ? <a href={row.href}>{row.text}</a> : <p>{row.text}</p>}
            </li>
          ))}
        </ul>
        {content.join ? <p className="mt-8 whitespace-pre-line text-sm text-[#8b93a7]">{content.join}</p> : null}
      </Panel>
    </main>
  );
}
