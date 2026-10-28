"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import DotField from "@/components/DotField";
import ClubFooter from "@/components/club/ClubFooter";
import SiteHeader from "@/components/SiteHeader";
import type { Chrome } from "@/lib/nav";
import type { Lang } from "@/lib/types";

export default function SiteFrame({
  lang,
  chrome,
  whatsapp,
  instagram,
  footer,
  children,
}: {
  lang: Lang;
  chrome: Chrome;
  whatsapp?: string;
  instagram?: string;
  footer: {
    name: string;
    logoUrl: string;
    copyright: string;
  };
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = lang === "zh-Hant" ? "zh-Hant" : lang === "en" ? "en" : "zh-Hans";
  }, [lang]);
  const pathname = usePathname();
  const onHome = pathname === `/${lang}`;

  if (onHome) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DotField />
      <SiteHeader lang={lang} chrome={chrome} whatsapp={whatsapp} instagram={instagram} />
      {children}
      <ClubFooter
        className="border-t border-slate-900"
        name={footer.name}
        logoUrl={footer.logoUrl}
        copyright={footer.copyright}
      />
    </div>
  );
}
