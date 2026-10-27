import { notFound } from "next/navigation";
import SiteFrame from "@/components/SiteFrame";
import { getChrome } from "@/lib/chrome";
import { readContact } from "@/lib/content";
import { loadClub } from "@/lib/site";
import { isLang } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [chrome, contact, club] = await Promise.all([Promise.resolve(getChrome(lang)), readContact(), loadClub(lang)]);
  const digits = contact.whatsapp.replace(/\D/g, "");

  return (
    <SiteFrame
      lang={lang}
      chrome={chrome}
      whatsapp={digits ? `https://wa.me/${digits}` : undefined}
      instagram={/^https?:\/\//.test(contact.instagram) ? contact.instagram : undefined}
      footer={{
        name: club.name,
        logoUrl: club.logoUrl,
        copyright: club.footer,
        contacts: club.footerContacts,
      }}
    >
      {children}
    </SiteFrame>
  );
}
