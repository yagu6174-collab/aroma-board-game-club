const HEX = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#6366f1", "#fb7185"];

export default function ClubFooter({
  name,
  logoUrl,
  copyright,
  metaColor,
  editMode = false,
  picked = false,
  onEdit,
  className = "",
}: {
  name: string;
  logoUrl?: string;
  copyright: string;
  metaColor?: string;
  editMode?: boolean;
  picked?: boolean;
  onEdit?: () => void;
  className?: string;
}) {
  const line = copyright.trim();

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
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-3 px-4 py-6 sm:grid-cols-[1fr_auto_1fr] sm:px-6 sm:py-7 lg:px-8">
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <Mark logoUrl={logoUrl} />
          {name.trim() ? <p className="text-lg font-black whitespace-nowrap text-white">{name}</p> : null}
        </div>
        {line ? (
          <p className="text-center text-sm" style={{ color: metaColor ?? "#64748b" }}>
            {line}
          </p>
        ) : (
          <span className="hidden sm:block" />
        )}
        <span className="hidden sm:block" aria-hidden />
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
