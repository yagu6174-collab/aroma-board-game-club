import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import { getChrome } from "@/lib/chrome";
import { readContact } from "@/lib/content";
import { toTraditional } from "@/lib/traditional";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getChrome(lang).contact };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [contact, chrome] = await Promise.all([readContact(), Promise.resolve(getChrome(lang))]);
  const hint = lang === "zh-Hant" ? toTraditional(contact.hint) : contact.hint;
  const rows: { label: string; text: string; href?: string }[] = [];

  if (contact.email) {
    rows.push({
      label: chrome.email,
      text: contact.email,
      href: contact.email.includes("@") ? `mailto:${contact.email}` : undefined,
    });
  }
  if (contact.wechat) rows.push({ label: chrome.wechat, text: contact.wechat });
  if (contact.whatsapp) {
    const digits = contact.whatsapp.replace(/\D/g, "");
    rows.push({
      label: chrome.whatsapp,
      text: contact.whatsapp,
      href: digits ? `https://wa.me/${digits}` : undefined,
    });
  }
  if (contact.instagram) {
    rows.push({
      label: chrome.instagram,
      text: contact.instagram,
      href: /^https?:\/\//.test(contact.instagram) ? contact.instagram : undefined,
    });
  }

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
        {hint ? <p className="mt-8 text-sm text-[#8b93a7]">{hint}</p> : null}
      </Panel>
    </main>
  );
}
