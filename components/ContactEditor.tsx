"use client";

import { useState } from "react";
import type { ContactDoc } from "@/lib/types";
import { buttonClass, fieldClass } from "@/components/ui";

const fields = [
  ["email", "邮箱"],
  ["wechat", "微信"],
  ["whatsapp", "WhatsApp"],
  ["instagram", "Instagram"],
] as const;

export default function ContactEditor({ initial }: { initial: ContactDoc }) {
  const [doc, setDoc] = useState(initial);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const res = await fetch("/api/content/contact", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(doc),
    });
    if (!res.ok) {
      setMessage("没有保存。");
      return;
    }
    setDoc((await res.json()) as ContactDoc);
    setMessage("已保存。");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {fields.map(([key, label]) => (
        <label key={key} className="mt-4 block text-sm">
          {label}
          <input value={doc[key]} onChange={(event) => setDoc({ ...doc, [key]: event.target.value })} className={fieldClass} />
        </label>
      ))}
      <label className="mt-4 block text-sm" htmlFor="hint">
        提示
        <textarea id="hint" rows={3} value={doc.hint} onChange={(event) => setDoc({ ...doc, hint: event.target.value })} className={fieldClass} />
      </label>
      <button type="submit" className={`${buttonClass} mt-6`}>
        保存
      </button>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
    </form>
  );
}
