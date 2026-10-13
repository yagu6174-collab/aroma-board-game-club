"use client";

import { useState } from "react";

export type EventCard = {
  period: string;
  title: string;
  detail: string;
  date: string;
  articleTitle: string;
  body: string;
  count: string;
};

export default function EventCards({ items, chars }: { items: EventCard[]; chars: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item, index) => {
        const shown = open === index;
        return (
          <article key={`${item.period}-${item.title}`} className={shown ? "md:col-span-3" : undefined}>
            <button
              type="button"
              aria-expanded={shown}
              onClick={() => setOpen(shown ? null : index)}
              className="h-full w-full rounded-[2rem] bg-white p-6 text-center shadow-sm"
            >
              <p className="text-sm font-bold text-slate-500">{item.period}</p>
              <h2 className="mt-3 text-xl font-black text-slate-900">{item.title}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{item.detail}</p>
            </button>
            {shown && item.body ? (
              <div className="mt-4 rounded-[2rem] bg-white px-6 py-8 text-center shadow-sm md:px-10">
                <p className="text-sm font-bold text-slate-500">{item.date}</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.articleTitle}</h3>
                <p className="mx-auto mt-6 max-w-3xl whitespace-pre-line leading-relaxed text-slate-700">{item.body}</p>
                <p className="mt-6 text-sm text-slate-400">
                  {item.count} {chars}
                </p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
