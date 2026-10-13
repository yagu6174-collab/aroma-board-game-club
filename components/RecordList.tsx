import type { RecordItem } from "@/lib/types";

export default function RecordList({ items }: { items: RecordItem[] }) {
  return (
    <div>
      {items.map((item) => (
        <article key={`${item.period}-${item.title}-${item.detail}`} className="border-t border-current/15 py-6 first:border-t-0">
          {item.period ? <p className="text-sm opacity-70">{item.period}</p> : null}
          {item.title ? <h2 className="mt-1 text-2xl font-semibold tracking-tight">{item.title}</h2> : null}
          {item.detail ? <p className="mt-2 whitespace-pre-line opacity-80">{item.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}
