import { safeMapUrl, type FooterContacts } from "@/lib/footerLinks";
import type { Lang } from "@/lib/types";

const HEX = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#6366f1", "#fb7185"];

function captions(lang: Lang) {
  if (lang === "en") return { address: "Venue", newWindow: " (opens in a new window)" };
  if (lang === "zh-Hant") return { address: "地點", newWindow: "（新視窗）" };
  return { address: "地点", newWindow: "（新窗口）" };
}

export default function ClubFooter({
  name,
  logoUrl,
  copyright,
  contacts,
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
  lang: Lang;
  metaColor?: string;
  editMode?: boolean;
  picked?: boolean;
  onEdit?: () => void;
  className?: string;
}) {
  const label = captions(lang);
  const address = contacts.address.trim().replace(/\s+/g, " ");
  const mapUrl = safeMapUrl(contacts.mapUrl);
  const mapLabel = contacts.mapLabel.trim();
  const showMap = Boolean(mapUrl && mapLabel);

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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex min-w-0 flex-col items-stretch gap-4 md:flex-row md:flex-nowrap md:items-center md:gap-6 lg:gap-8">
          <div className="flex shrink-0 items-center gap-3">
            <Mark logoUrl={logoUrl} />
            <p className="whitespace-nowrap text-lg font-black text-white">{name}</p>
          </div>
          {address ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-orange-400 ring-1 ring-white/10">
                <PinIcon />
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-[11px] font-bold tracking-wide text-slate-400">{label.address}</span>
                <span className="block truncate text-sm font-bold leading-6 text-slate-100" title={address}>
                  {address}
                </span>
              </span>
            </div>
          ) : null}
          {showMap ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-black whitespace-nowrap text-white transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 md:w-auto ${editMode ? "pointer-events-none" : ""}`}
              tabIndex={editMode ? -1 : undefined}
            >
              <PinIcon />
              {mapLabel}
              <span className="sr-only">{label.newWindow}</span>
            </a>
          ) : null}
        </div>
        {copyright.trim() ? (
          <p className="mt-8 border-t border-white/10 pt-5 text-center text-sm" style={{ color: metaColor ?? "#64748b" }}>
            {copyright}
          </p>
        ) : null}
      </div>
    </footer>
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
