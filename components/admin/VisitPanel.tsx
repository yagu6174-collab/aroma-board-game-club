import type { VisitSummary } from "@/lib/visitMath";

const stats = [
  ["今日", "today"],
  ["近7日", "last7"],
  ["累计", "total"],
] as const;

const cardClass = "flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_8px_24px_rgba(28,25,23,0.04)] sm:p-5";

export default function VisitPanel({ visits }: { visits: VisitSummary }) {
  return (
    <section aria-label="访问量" className={cardClass}>
      <div>
        <h2 className="text-base font-black">访问量</h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">公开首页每打开一次计一次。</p>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {stats.map(([label, key]) => (
          <div key={key} className="rounded-xl bg-stone-50 px-3 py-2.5">
            <dt className="text-xs font-bold text-stone-500">{label}</dt>
            <dd className="mt-1 text-xl font-black tabular-nums leading-none sm:text-2xl">{visits[key].toLocaleString("zh-Hans")}</dd>
          </div>
        ))}
      </dl>
      <ol className="mt-4 grid grid-cols-7 gap-1.5">
        {visits.days.map((day) => (
          <li
            key={day.date}
            aria-current={day.today ? "date" : undefined}
            className={`rounded-xl px-1 py-1.5 text-center text-[11px] leading-tight tabular-nums sm:text-xs ${day.today ? "bg-indigo-600 font-bold text-white" : "bg-stone-50 text-stone-600 ring-1 ring-stone-200"}`}
          >
            <span className="block">{day.label}</span>
            <span className="mt-0.5 block text-sm font-black">{day.count.toLocaleString("zh-Hans")}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
