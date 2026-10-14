"use client";

import { useMemo, useState, type ReactNode } from "react";
import ClubHome from "@/components/club/ClubHome";
import LogoutButton from "@/components/LogoutButton";
import { clubContent } from "@/data/club";
import { applySiteDraft, type SiteDraft, type SiteEventDraft, type SiteGameDraft } from "@/data/siteDraft";

const fieldClass = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900";

const kinds = [
  ["party", "派对"],
  ["strategy", "策略"],
  ["deduce", "推理阵营"],
  ["other", "其他"],
] as const;

function localStart(iso: string) {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(iso);
  return match?.[1] ?? "";
}

export default function SiteEditor({ initial }: { initial: SiteDraft }) {
  const [draft, setDraft] = useState(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [pane, setPane] = useState<"preview" | "edit">("preview");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const content = useMemo(() => applySiteDraft(clubContent, draft), [draft]);

  function choose(id: string) {
    setSelected(id);
    setPane("edit");
  }

  async function save() {
    setSaving(true);
    setStatus("");
    const res = await fetch("/api/site", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      setStatus("没有保存。");
      return;
    }
    setDraft((await res.json()) as SiteDraft);
    setStatus("已保存。公开页现在用这份内容。");
  }

  return (
    <div className="flex h-dvh flex-col bg-stone-100 text-stone-900">
      <header className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
        <p className="text-sm font-black">后台</p>
        <div className="flex rounded-full bg-stone-100 p-1 lg:hidden">
          <button type="button" onClick={() => setPane("preview")} className={`rounded-full px-3 py-1 text-xs font-bold ${pane === "preview" ? "bg-white shadow" : ""}`}>
            预览
          </button>
          <button type="button" onClick={() => setPane("edit")} className={`rounded-full px-3 py-1 text-xs font-bold ${pane === "edit" ? "bg-white shadow" : ""}`}>
            表单
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-stone-500">{status}</span>
          <button type="button" onClick={() => void save()} disabled={saving} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {saving ? "保存中…" : "保存"}
          </button>
          <LogoutButton />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className={`min-w-0 flex-1 overflow-y-auto [transform:translateZ(0)] ${pane === "edit" ? "max-lg:hidden" : ""}`}>
          <ClubHome content={content} lang="zh" editMode selected={selected} onSelect={choose} />
        </div>
        <aside className={`w-full shrink-0 overflow-y-auto border-l border-stone-200 bg-white lg:w-96 ${pane === "preview" ? "max-lg:hidden" : ""}`}>
          <EditorForm draft={draft} selected={selected} onChange={setDraft} />
        </aside>
      </div>
    </div>
  );
}

function EditorForm({
  draft,
  selected,
  onChange,
}: {
  draft: SiteDraft;
  selected: string | null;
  onChange: (next: SiteDraft) => void;
}) {
  const game = draft.games.find((item) => selected === `game:${item.id}`);
  const event = draft.events.find((item) => selected === `event:${item.id}`);

  if (selected === "claim") {
    return (
      <FormShell title="首屏主张">
        <Field label="主张">
          <textarea rows={6} value={draft.claim} onChange={(input) => onChange({ ...draft, claim: input.target.value })} className={fieldClass} />
        </Field>
      </FormShell>
    );
  }

  if (selected === "about") {
    return (
      <FormShell title="关于正文">
        <Field label="正文">
          <textarea rows={8} value={draft.about} onChange={(input) => onChange({ ...draft, about: input.target.value })} className={fieldClass} />
        </Field>
      </FormShell>
    );
  }

  if (selected === "join") {
    return (
      <FormShell title="加入我们">
        <Field label="地点提示">
          <textarea rows={3} value={draft.contact.hint} onChange={(input) => onChange({ ...draft, contact: { ...draft.contact, hint: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="邮箱">
          <input value={draft.contact.email} onChange={(input) => onChange({ ...draft, contact: { ...draft.contact, email: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="微信">
          <input value={draft.contact.wechat} onChange={(input) => onChange({ ...draft, contact: { ...draft.contact, wechat: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="WhatsApp">
          <input value={draft.contact.whatsapp} onChange={(input) => onChange({ ...draft, contact: { ...draft.contact, whatsapp: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="Instagram">
          <input value={draft.contact.instagram} onChange={(input) => onChange({ ...draft, contact: { ...draft.contact, instagram: input.target.value } })} className={fieldClass} />
        </Field>
      </FormShell>
    );
  }

  if (game) {
    return (
      <FormShell title={game.name || "桌游"}>
        <GameFields
          game={game}
          onChange={(next) => onChange({ ...draft, games: draft.games.map((item) => (item.id === game.id ? next : item)) })}
        />
      </FormShell>
    );
  }

  if (event) {
    return (
      <FormShell title={event.title || "活动"}>
        <EventFields
          event={event}
          onChange={(next) => onChange({ ...draft, events: draft.events.map((item) => (item.id === event.id ? next : item)) })}
        />
      </FormShell>
    );
  }

  return (
    <FormShell title="编辑">
      <p className="text-sm leading-relaxed text-stone-600">点预览里的主张、关于、一盒桌游、一张活动卡，或加入我们这段文字。</p>
    </FormShell>
  );
}

function GameFields({ game, onChange }: { game: SiteGameDraft; onChange: (next: SiteGameDraft) => void }) {
  return (
    <>
      <Field label="名称">
        <input value={game.name} onChange={(input) => onChange({ ...game, name: input.target.value })} className={fieldClass} />
      </Field>
      <Field label="人数">
        <input value={game.players} onChange={(input) => onChange({ ...game, players: input.target.value })} className={fieldClass} />
      </Field>
      <Field label="类型">
        <select value={game.kind} onChange={(input) => onChange({ ...game, kind: input.target.value as SiteGameDraft["kind"] })} className={fieldClass}>
          {kinds.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="简介">
        <textarea rows={4} value={game.blurb} onChange={(input) => onChange({ ...game, blurb: input.target.value })} className={fieldClass} />
      </Field>
      <label className="mt-4 flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={game.borrowable} onChange={(input) => onChange({ ...game, borrowable: input.target.checked })} />
        可以预约借用
      </label>
    </>
  );
}

function EventFields({ event, onChange }: { event: SiteEventDraft; onChange: (next: SiteEventDraft) => void }) {
  return (
    <>
      <Field label="开始时间">
        <input
          type="datetime-local"
          value={localStart(event.startsAt)}
          onChange={(input) => onChange({ ...event, startsAt: input.target.value ? `${input.target.value}:00+08:00` : "" })}
          className={fieldClass}
        />
      </Field>
      <p className="mt-1 text-xs text-stone-500">开始时间一过，卡片变成已结束；还没到的最近一场会出现在右下角。</p>
      <Field label="卡片上的时间">
        <input value={event.time} onChange={(input) => onChange({ ...event, time: input.target.value })} className={fieldClass} />
      </Field>
      <Field label="标题">
        <input value={event.title} onChange={(input) => onChange({ ...event, title: input.target.value })} className={fieldClass} />
      </Field>
      <Field label="费用">
        <input value={event.fee} onChange={(input) => onChange({ ...event, fee: input.target.value })} className={fieldClass} />
      </Field>
      <Field label="地点">
        <input value={event.place} onChange={(input) => onChange({ ...event, place: input.target.value })} className={fieldClass} />
      </Field>
      <Field label="摘要">
        <textarea rows={3} value={event.summary} onChange={(input) => onChange({ ...event, summary: input.target.value })} className={fieldClass} />
      </Field>
      <Field label="正文">
        <textarea rows={6} value={event.body} onChange={(input) => onChange({ ...event, body: input.target.value })} className={fieldClass} />
      </Field>
      {event.sessions.map((session, index) => (
        <fieldset key={index} className="mt-4 rounded-2xl border border-stone-200 p-3">
          <legend className="px-1 text-xs font-bold text-stone-500">场次 {index + 1}</legend>
          <Field label="场次名">
            <input
              value={session.name}
              onChange={(input) =>
                onChange({
                  ...event,
                  sessions: event.sessions.map((item, i) => (i === index ? { ...item, name: input.target.value } : item)),
                })
              }
              className={fieldClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="已报">
              <input
                type="number"
                min={0}
                value={session.signed}
                onChange={(input) =>
                  onChange({
                    ...event,
                    sessions: event.sessions.map((item, i) => (i === index ? { ...item, signed: Number(input.target.value) } : item)),
                  })
                }
                className={fieldClass}
              />
            </Field>
            <Field label="名额">
              <input
                type="number"
                min={0}
                value={session.capacity}
                onChange={(input) =>
                  onChange({
                    ...event,
                    sessions: event.sessions.map((item, i) => (i === index ? { ...item, capacity: Number(input.target.value) } : item)),
                  })
                }
                className={fieldClass}
              />
            </Field>
          </div>
        </fieldset>
      ))}
    </>
  );
}

function FormShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-5">
      <h2 className="text-lg font-black">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-4 block text-sm font-bold">
      {label}
      {children}
    </label>
  );
}
