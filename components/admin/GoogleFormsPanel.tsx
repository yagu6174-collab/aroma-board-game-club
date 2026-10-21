"use client";

import { useState } from "react";

export type GoogleNotice = { text: string; warn: boolean };

type SyncResponse = {
  connected?: boolean;
  updates?: { id: string; signed: number }[];
  messages?: GoogleNotice[];
};

export default function GoogleFormsPanel({
  connected,
  messages,
  onSynced,
}: {
  connected: boolean;
  messages: GoogleNotice[];
  onSynced: (updates: { id: string; signed: number }[]) => void;
}) {
  const [linked, setLinked] = useState(connected);
  const [notes, setNotes] = useState(messages);
  const [busy, setBusy] = useState<"sync" | "disconnect" | "">("");

  async function sync() {
    setBusy("sync");
    const res = await fetch("/api/google/sync", { method: "POST" });
    const body = (await res.json().catch(() => null)) as SyncResponse | null;
    setBusy("");
    if (!res.ok || !body) {
      setNotes([{ text: "同步没有完成，报名人数保持原数字。", warn: true }]);
      return;
    }
    if (typeof body.connected === "boolean") setLinked(body.connected);
    setNotes(Array.isArray(body.messages) ? body.messages : []);
    if (Array.isArray(body.updates) && body.updates.length) onSynced(body.updates);
  }

  async function disconnect() {
    setBusy("disconnect");
    const res = await fetch("/api/google/disconnect", { method: "POST" });
    setBusy("");
    if (!res.ok) {
      setNotes([{ text: "没有断开，请再试一次。", warn: true }]);
      return;
    }
    setLinked(false);
    setNotes([{ text: "已断开 Google 表单。报名人数保持当前数字。", warn: false }]);
  }

  return (
    <section id="google-forms" aria-label="Google 表单人数" className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_8px_24px_rgba(28,25,23,0.04)] sm:p-5">
      <div>
        <h2 className="text-base font-black">Google 表单人数</h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          连接表单所有者的 Google 账号。同步后，回复数写入活动卡片的已报人数。公开页面只显示数字和报名链接。
        </p>
        <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${linked ? "bg-indigo-50 text-indigo-700" : "bg-stone-100 text-stone-600"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${linked ? "bg-indigo-600" : "bg-stone-400"}`} aria-hidden="true" />
          {linked ? "已连接表单所有者账号" : "未连接"}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
        <form action="/api/google/start" method="get" className="inline">
          <button id="google-connect" type="submit" className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
            {linked ? "重新连接" : "连接 Google 表单"}
          </button>
        </form>
        {linked ? (
          <button type="button" onClick={() => void disconnect()} disabled={busy !== ""} className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-bold hover:bg-stone-50 disabled:opacity-60">
            {busy === "disconnect" ? "断开中…" : "断开连接"}
          </button>
        ) : null}
        <button id="sync-signups" type="button" onClick={() => void sync()} disabled={busy !== ""} className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-bold hover:bg-stone-50 disabled:opacity-60">
          {busy === "sync" ? "同步中…" : "同步报名人数"}
        </button>
      </div>
      {notes.length ? (
        <ul className="mt-3 space-y-1.5">
          {notes.map((item, index) => (
            <li key={`${item.text}-${index}`} className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${item.warn ? "bg-red-50 font-bold text-red-700" : "bg-stone-50 text-stone-600"}`}>
              {item.text}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
