"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Chrome } from "@/lib/nav";
import type { Lang } from "@/lib/types";

const LANGS: { id: Lang; label: string }[] = [
  { id: "zh", label: "简" },
  { id: "zh-Hant", label: "繁" },
  { id: "en", label: "EN" },
];

function withLang(pathname: string, lang: Lang) {
  const parts = pathname.split("/");
  parts[1] = lang;
  return parts.join("/") || `/${lang}`;
}

export default function SiteHeader({
  lang,
  chrome,
  whatsapp,
  instagram,
}: {
  lang: Lang;
  chrome: Chrome;
  whatsapp?: string;
  instagram?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onHome = pathname === `/${lang}`;
  const place = (id: string) => (onHome ? `#${id}` : `/${lang}#${id}`);
  const items = [
    [chrome.home, place("top")],
    [chrome.about, place("about")],
    [chrome.games, place("games")],
    [chrome.events, place("events")],
    [chrome.contact, place("contact")],
  ] as const;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={`/${lang}`} className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-sm font-black text-white">A</span>
              <span className="text-sm font-black tracking-tight text-slate-900 sm:text-base">Aroma</span>
            </Link>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            {instagram ? (
              <a href={instagram} aria-label={chrome.instagram} className="grid h-11 w-11 place-items-center rounded-full text-slate-900">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            ) : null}
            {whatsapp ? (
              <a href={whatsapp} aria-label={chrome.whatsapp} className="grid h-11 w-11 place-items-center rounded-full text-emerald-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path fill="currentColor" d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm0 16.2a7.2 7.2 0 0 1-3.7-1l-.3-.2-2.8.7.7-2.7-.2-.3A7.2 7.2 0 1 1 12 19.2z" />
                </svg>
              </a>
            ) : null}
            <p className="hidden gap-2 text-xs font-bold text-slate-400 lg:flex">
              {LANGS.map((item) => (
                <Link key={item.id} href={withLang(pathname, item.id)} className={item.id === lang ? "text-slate-900" : undefined}>
                  {item.label}
                </Link>
              ))}
            </p>
          </div>
          <div className="hidden items-center gap-5 md:flex xl:gap-8">
            {items.map(([label, href]) => (
              <Link key={label} href={href} className="py-2 text-sm font-bold text-slate-600">
                {label}
              </Link>
            ))}
            <Link href={place("contact")} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-indigo-200">
              {chrome.contact}
            </Link>
          </div>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-slate-600 md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            {chrome.menu}
          </button>
        </div>
        {open ? (
          <div className="flex flex-col gap-3 pb-4 md:hidden">
            {items.map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)} className="text-sm font-bold text-slate-600">
                {label}
              </Link>
            ))}
            <p className="flex gap-3 text-xs text-slate-400">
              {LANGS.map((item) => (
                <Link key={item.id} href={withLang(pathname, item.id)}>
                  {item.label}
                </Link>
              ))}
            </p>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
