"use client";

import { useState } from "react";
import type { RecordItem, RecordsDoc } from "@/lib/types";
import { buttonClass, fieldClass, quietButtonClass } from "@/components/ui";

const empty = (): RecordItem => ({ period: "", title: "", detail: "" });

export default function RecordsEditor({
  doc,
  initial,
}: {
  doc: "games" | "events";
  initial: RecordsDoc;
}) {
  const [items, setItems] = useState<RecordItem[]>(initial.items.length ? initial.items : [empty()]);
  const [message, setMessage] = useState("");

  function update(index: number, patch: Partial<RecordItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function save() {
    setMessage("");
    const res = await fetch(`/api/content/${doc}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      setMessage("没有保存。");
      return;
    }
    const saved = (await res.json()) as RecordsDoc;
    setItems(saved.items.length ? saved.items : [empty()]);
    setMessage("已保存。");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-8"
    >
      {items.map((item, index) => (
        <fieldset key={index} className="border-t border-[#e4dcd0] pt-6">
          <label className="block text-sm">
            时段
            <input value={item.period} onChange={(event) => update(index, { period: event.target.value })} className={fieldClass} />
          </label>
          <label className="mt-4 block text-sm">
            标题
            <input value={item.title} onChange={(event) => update(index, { title: event.target.value })} className={fieldClass} />
          </label>
          <label className="mt-4 block text-sm">
            说明
            <textarea rows={3} value={item.detail} onChange={(event) => update(index, { detail: event.target.value })} className={fieldClass} />
          </label>
          <button type="button" className={`${quietButtonClass} mt-3`} onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
            去掉这行
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-4">
        <button type="button" className={quietButtonClass} onClick={() => setItems((current) => [...current, empty()])}>
          加一行
        </button>
        <button type="submit" className={buttonClass}>
          保存
        </button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
