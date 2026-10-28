import { safeMapUrl, type FooterContacts } from "@/lib/footerLinks";
import type { Lang } from "@/lib/types";

function captions(lang: Lang) {
  if (lang === "en") return { address: "Venue", newWindow: " (opens in a new window)", empty: "Venue and map" };
  if (lang === "zh-Hant") return { address: "地點", newWindow: "（新視窗）", empty: "地點和地圖" };
  return { address: "地点", newWindow: "（新窗口）", empty: "地点和地图" };
}

export default function VenueCluster({
  contacts,
  lang,
  editMode = false,
  picked = false,
  onEdit,
  className = "",
}: {
  contacts: FooterContacts;
  lang: Lang;
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
  const pickedClass = picked
    ? "relative z-[1] rounded-2xl bg-orange-400/15 ring-4 ring-orange-500 ring-offset-2 ring-offset-slate-900 shadow-[0_0_0_4px_rgba(249,115,22,0.22)]"
    : "";

  function edit(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
    onEdit?.();
  }

  if (!address && !showMap) {
    if (!editMode) return null;
    return (
      <button type="button" onClick={edit} className={`inline-flex min-h-11 items-center justify-center self-center rounded-xl border border-dashed border-white/50 px-6 text-sm font-bold text-white sm:self-center lg:self-auto ${pickedClass} ${className}`}>
        {label.empty}
      </button>
    );
  }

  return (
    <div
      className={`flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:self-center lg:shrink-0 lg:self-auto ${pickedClass} ${editMode ? "cursor-pointer" : ""} ${className}`}
      onClick={editMode ? edit : undefined}
    >
      {address ? (
        <div className="flex min-w-0 items-center justify-center gap-3 sm:max-w-xs sm:justify-start">
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
          className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-black whitespace-nowrap text-white transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 sm:w-auto ${editMode ? "pointer-events-none" : ""}`}
          tabIndex={editMode ? -1 : undefined}
        >
          <PinIcon />
          {mapLabel}
          <span className="sr-only">{label.newWindow}</span>
        </a>
      ) : null}
    </div>
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
