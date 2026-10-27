import type { ReactNode } from "react";
import type { FooterContacts } from "@/lib/footerLinks";
import { emailHref, phoneHref, safeMapUrl, whatsappHref } from "@/lib/footerLinks";
import type { Lang } from "@/lib/types";

const HEX = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#6366f1", "#fb7185"];

export type ClubFooterLink = { href: string; label: string };

function captions(lang: Lang) {
  if (lang === "en") {
    return { nav: "Footer", address: "Venue", phone: "Phone", whatsapp: "WhatsApp", email: "Email", newWindow: " (opens in a new window)" };
  }
  if (lang === "zh-Hant") {
    return { nav: "頁腳", address: "地點", phone: "電話", whatsapp: "WhatsApp", email: "郵箱", newWindow: "（新視窗）" };
  }
  return { nav: "页脚", address: "地点", phone: "电话", whatsapp: "WhatsApp", email: "邮箱", newWindow: "（新窗口）" };
}

export default function ClubFooter({
  name,
  logoUrl,
  copyright,
  contacts,
  links,
  lang,
  metaColor,
  editMode = false,
  picked = false,
  onEdit,
  className = "",
}: {
  name: string;
  logoUrl?: string;
  copyright: string;
  contacts: FooterContacts;
  links: readonly ClubFooterLink[];
  lang: Lang;
  metaColor?: string;
  editMode?: boolean;
  picked?: boolean;
  onEdit?: () => void;
  className?: string;
}) {
  const label = captions(lang);
  const phone = phoneHref(contacts.phone);
  const whatsapp = whatsappHref(contacts.whatsapp);
  const email = emailHref(contacts.email);
  const mapUrl = safeMapUrl(contacts.mapUrl);
  const showMap = Boolean(mapUrl && contacts.mapLabel.trim());
  const rows = [
    contacts.address.trim()
      ? { key: "address", label: label.address, value: contacts.address.trim(), href: "", external: false, icon: <PinIcon /> }
      : null,
    contacts.phone.trim()
      ? { key: "phone", label: label.phone, value: contacts.phone.trim(), href: phone, external: false, icon: <PhoneIcon /> }
      : null,
    contacts.whatsapp.trim()
      ? { key: "whatsapp", label: label.whatsapp, value: contacts.whatsapp.trim(), href: whatsapp, external: true, icon: <WhatsappIcon /> }
      : null,
    contacts.email.trim()
      ? { key: "email", label: label.email, value: contacts.email.trim(), href: email, external: false, icon: <MailIcon /> }
      : null,
  ].filter((row) => row !== null);

  return (
    <footer
      className={`bg-slate-950 text-slate-300 ${picked ? "relative z-[1] ring-4 ring-orange-500 ring-offset-2 ring-offset-slate-950" : ""} ${editMode ? "cursor-pointer" : ""} ${className}`}
      onClick={
        editMode
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit?.();
            }
          : undefined
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-12">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Mark logoUrl={logoUrl} />
              <p className="text-lg font-black text-white">{name}</p>
            </div>
            {rows.length ? (
              <ul className="mt-6 max-w-xl space-y-1">
                {rows.map((row) => (
                  <li key={row.key}>
                    <ContactRow
                      label={row.label}
                      value={row.value}
                      href={row.href}
                      external={row.external}
                      icon={row.icon}
                      editMode={editMode}
                      newWindow={label.newWindow}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            {showMap ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className={`mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-black text-white transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 sm:w-auto ${editMode ? "pointer-events-none" : ""}`}
                tabIndex={editMode ? -1 : undefined}
              >
                <PinIcon />
                {contacts.mapLabel.trim()}
                <span className="sr-only">{label.newWindow}</span>
              </a>
            ) : null}
          </div>
          <nav aria-label={label.nav} className="flex flex-wrap gap-x-6 md:flex-col md:items-end md:gap-y-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`inline-flex min-h-11 items-center text-sm font-bold text-slate-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 ${editMode ? "pointer-events-none" : ""}`}
                tabIndex={editMode ? -1 : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        {copyright.trim() ? (
          <p className="mt-10 border-t border-white/10 pt-6 text-center text-sm" style={{ color: metaColor ?? "#64748b" }}>
            {copyright}
          </p>
        ) : null}
      </div>
    </footer>
  );
}

function ContactRow({
  label,
  value,
  href,
  external,
  editMode,
  icon,
  newWindow,
}: {
  label: string;
  value: string;
  href: string;
  external: boolean;
  editMode: boolean;
  icon: ReactNode;
  newWindow: string;
}) {
  const body = (
    <>
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-orange-400 ring-1 ring-white/10">{icon}</span>
      <span className="min-w-0 text-left">
        <span className="block text-[11px] font-bold tracking-wide text-slate-400">{label}</span>
        <span className="block text-sm font-bold leading-6 break-words whitespace-pre-line text-slate-100">{value}</span>
      </span>
    </>
  );
  const rowClass = "flex min-h-11 items-start gap-3 rounded-2xl py-1";
  if (editMode || !href) {
    return <div className={rowClass}>{body}</div>;
  }
  return (
    <a
      href={href}
      className={`${rowClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300`}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {body}
      {external ? <span className="sr-only">{newWindow}</span> : null}
    </a>
  );
}

function Mark({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) {
    return (
      <span className="block h-11 w-11 overflow-hidden rounded-2xl bg-slate-900" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className="grid h-11 w-11 grid-cols-3 place-items-center gap-0.5 rounded-2xl bg-slate-900 p-1.5" aria-hidden>
      {HEX.map((color) => (
        <span key={color} className="h-2 w-2" style={{ background: color, clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }} />
      ))}
    </span>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        d="M8 4h3l1.2 3.2-1.8 1.1a12 12 0 0 0 5.3 5.3l1.1-1.8 3.2 1.2v3A2 2 0 0 1 18 18 14 14 0 0 1 6 6a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m5 7 7 6 7-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 4a8 8 0 0 0-6.9 12l-1 3.6 3.7-1A8 8 0 1 0 12 4Zm4.3 11.3c-.2.5-1 .9-1.4 1-.4 0-.8.2-2.7-.6-2.3-.9-3.7-3.2-3.8-3.4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5l-.3.4c-.1.2-.3.3-.1.6.2.3.7 1.1 1.4 1.8.9.8 1.7 1.1 2 .1.2-.2.4-.4.6-.3.3.1 1.6.8 1.9.9.3.2.4.2.5.3.1.2 0 .8-.2 1.1Z" />
    </svg>
  );
}
