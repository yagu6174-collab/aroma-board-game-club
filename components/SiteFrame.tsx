"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import DotField from "@/components/DotField";
import SiteHeader from "@/components/SiteHeader";
import type { Chrome } from "@/lib/nav";
import type { Lang } from "@/lib/types";

export default function SiteFrame({
  lang,
  chrome,
  whatsapp,
  instagram,
  children,
}: {
  lang: Lang;
  chrome: Chrome;
  whatsapp?: string;
  instagram?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = lang === "zh-Hant" ? "zh-Hant" : lang === "en" ? "en" : "zh-Hans";
  }, [lang]);
  const pathname = usePathname();
  const onHome = pathname === `/${lang}`;
  const place = (id: string) => (onHome ? `#${id}` : `/${lang}#${id}`);

  if (onHome) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DotField />
      <SiteHeader lang={lang} chrome={chrome} whatsapp={whatsapp} instagram={instagram} />
      {children}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-slate-400 md:py-16">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 px-4 text-sm font-bold">
          <a href={place("about")}>{chrome.about}</a>
          <a href={place("games")}>{chrome.games}</a>
          <a href={place("events")}>{chrome.events}</a>
          <a href={place("contact")}>{chrome.contact}</a>
        </div>
        <p className="mt-6 text-sm">{chrome.footer}</p>
      </footer>
    </div>
  );
}
