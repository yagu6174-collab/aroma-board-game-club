"use client";

import { useState } from "react";
import type { HomeDoc } from "@/lib/types";
import { buttonClass, fieldClass } from "@/components/ui";

export default function HomeEditor({ initial }: { initial: HomeDoc }) {
  const [claim, setClaim] = useState(initial.claim);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const res = await fetch("/api/content/home", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ claim }),
    });
    if (!res.ok) {
      setMessage("没有保存。");
      return;
    }
    const doc = (await res.json()) as HomeDoc;
    setClaim(doc.claim);
    setMessage("已保存。");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label className="block text-sm" htmlFor="claim">
        主张
        <textarea id="claim" rows={6} value={claim} onChange={(event) => setClaim(event.target.value)} className={fieldClass} />
      </label>
      <button type="submit" className={`${buttonClass} mt-6`}>
        保存
      </button>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
    </form>
  );
}
