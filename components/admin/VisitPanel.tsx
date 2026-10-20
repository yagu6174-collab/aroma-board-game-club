import type { VisitSummary } from "@/lib/visitMath";

const stats = [
  ["今日", "today"],
  ["近7日", "last7"],
  ["累计", "total"],
] as const;

export default function VisitPanel({ visits }: { visits: VisitSummary }) {
  return (
    <section aria-label="访问量" className="border-b border-stone-200 bg-stone-50 px-4 py-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-black">访问量</h2>
          <p className="mt-0.5 text-xs text-stone-500">公开首页每打开一次计一次。</p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {stats.map(([label, key]) => (
            <div key={key}>
              <dt className="text-xs font-bold text-stone-500">{label}</dt>
              <dd className="text-2xl font-black tabular-nums leading-none">{visits[key].toLocaleString("zh-Hans")}</dd>
            </div>
          ))}
        </dl>
      </div>
      <ol className="mt-3 flex flex-wrap gap-1.5">
        {visits.days.map((day) => (
          <li
            key={day.date}
            aria-current={day.today ? "date" : undefined}
            className={`rounded-full px-2.5 py-1 text-xs tabular-nums ${day.today ? "bg-indigo-600 font-bold text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}
          >
            {day.label} {day.count.toLocaleString("zh-Hans")}
          </li>
        ))}
      </ol>
    </section>
  );
}
