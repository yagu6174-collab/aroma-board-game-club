"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const [pending, setPending] = useState<null | { message: string; run: () => void }>(null);
  const content = useMemo(() => applySiteDraft(clubContent, draft), [draft]);

  useEffect(() => {
    document.documentElement.classList.remove("dice-on");
  }, []);

  function ask(message: string, run: () => void) {
    setPending({ message, run });
  }

  function choose(id: string | null) {
    setSelected(id);
    if (id) setPane("edit");
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
          <ClubHome content={content} lang="zh" editMode selected={selected} onSelect={choose} onLibraryAdd={() => ask("要新增一盒桌游吗？", () => insertGame(setDraft, choose))} />
        </div>
        <aside className={`w-full shrink-0 overflow-y-auto border-l border-stone-200 bg-white lg:w-96 ${pane === "preview" ? "max-lg:hidden" : ""}`}>
          <EditorForm draft={draft} selected={selected} onChange={setDraft} onSelect={choose} ask={ask} />
        </aside>
      </div>
      {pending ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-3xl bg-white p-6 text-stone-900 shadow-xl">
            <p className="text-base font-bold leading-relaxed">{pending.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={quietClass} onClick={() => setPending(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                onClick={() => {
                  pending.run();
                  setPending(null);
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const quietClass = "rounded-full border border-stone-300 px-3 py-1.5 text-xs font-bold";

function EditorForm({
  draft,
  selected,
  onChange,
  onSelect,
  ask,
}: {
  draft: SiteDraft;
  selected: string | null;
  onChange: (next: SiteDraft | ((current: SiteDraft) => SiteDraft)) => void;
  onSelect: (id: string | null) => void;
  ask: (message: string, run: () => void) => void;
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

  if (selected === "hero") {
    return (
      <FormShell title="主标题">
        <Field label="第一行">
          <input value={draft.heroLines.line1} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line1: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="第二行前">
          <input value={draft.heroLines.line2Before} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line2Before: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="第二行强调">
          <input value={draft.heroLines.line2Mark} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line2Mark: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="第二行后">
          <input value={draft.heroLines.line2After} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line2After: input.target.value } })} className={fieldClass} />
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

  if (selected === "about-pill" || selected === "about-title" || selected === "about-p1") {
    return (
      <FormShell title="关于">
        <Field label="小标题">
          <input value={draft.sections.aboutPill} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, aboutPill: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="标题">
          <input value={draft.sections.aboutTitle} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, aboutTitle: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="第一段">
          <textarea rows={5} value={draft.sections.aboutP1} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, aboutP1: input.target.value } })} className={fieldClass} />
        </Field>
      </FormShell>
    );
  }

  if (selected === "about-photo") {
    return (
      <FormShell title="社团照片">
        <ImageField label="图片" value={draft.photoUrl} onChange={(photoUrl) => onChange({ ...draft, photoUrl })} />
      </FormShell>
    );
  }

  if (selected === "games-copy") {
    return (
      <FormShell title="桌游区文字">
        <Field label="小标题">
          <input value={draft.sections.gamesPill} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, gamesPill: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="大标题前">
          <input value={draft.sections.gamesLead} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, gamesLead: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="大标题强调">
          <input value={draft.sections.gamesMark} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, gamesMark: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="大标题后">
          <input value={draft.sections.gamesTail} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, gamesTail: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="说明">
          <textarea rows={3} value={draft.sections.gamesSub} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, gamesSub: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="补充说明">
          <textarea rows={3} value={draft.sections.gamesNote} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, gamesNote: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="教学库标题">
          <input value={draft.sections.libraryTitle} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, libraryTitle: input.target.value } })} className={fieldClass} />
        </Field>
      </FormShell>
    );
  }

  if (selected === "news-copy") {
    return (
      <FormShell title="活动区文字">
        <Field label="小标题">
          <input value={draft.sections.newsPill} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, newsPill: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="标题">
          <input value={draft.sections.newsTitle} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, newsTitle: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="说明">
          <textarea rows={3} value={draft.sections.newsAside} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, newsAside: input.target.value } })} className={fieldClass} />
        </Field>
      </FormShell>
    );
  }

  if (selected === "join") {
    return (
      <FormShell title="加入我们">
        <Field label="标题">
          <input value={draft.sections.joinTitle} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, joinTitle: input.target.value } })} className={fieldClass} />
        </Field>
        <Field label="正文">
          <textarea rows={5} value={draft.join} onChange={(input) => onChange({ ...draft, join: input.target.value })} className={fieldClass} />
        </Field>
        <LinkFields
          links={draft.links}
          onChange={(links) => onChange({ ...draft, links })}
        />
      </FormShell>
    );
  }

  if (game) {
    return (
      <FormShell title={game.name || "桌游"}>
        <GameFields game={game} onChange={(next) => onChange({ ...draft, games: draft.games.map((item) => (item.id === game.id ? next : item)) })} />
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={quietClass} onClick={() => ask("要新增一盒桌游吗？", () => insertGame(onChange, onSelect))}>
            加一盒
          </button>
          <button
            type="button"
            className={quietClass}
            onClick={() =>
              ask(`要删除「${game.name || "这盒桌游"}」吗？`, () => {
                onChange({ ...draft, games: draft.games.filter((item) => item.id !== game.id) });
                onSelect(null);
              })
            }
          >
            删除这盒
          </button>
        </div>
      </FormShell>
    );
  }

  if (event) {
    return (
      <FormShell title={event.title || "活动"}>
        <EventFields event={event} onChange={(next) => onChange({ ...draft, events: draft.events.map((item) => (item.id === event.id ? next : item)) })} />
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={quietClass} onClick={() => ask("要新增一场活动吗？", () => insertEvent(onChange, onSelect))}>
            加一场
          </button>
          <button
            type="button"
            className={quietClass}
            onClick={() =>
              ask(`要删除「${event.title || "这场活动"}」吗？`, () => {
                onChange({ ...draft, events: draft.events.filter((item) => item.id !== event.id) });
                onSelect(null);
              })
            }
          >
            删除这场
          </button>
        </div>
      </FormShell>
    );
  }

  return (
    <FormShell title="编辑">
      <p className="text-sm leading-relaxed text-stone-600">点预览里的主张、关于、一盒桌游、一张活动卡，或加入我们这段文字。</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={quietClass} onClick={() => ask("要新增一盒桌游吗？", () => insertGame(onChange, onSelect))}>
          加一盒桌游
        </button>
        <button type="button" className={quietClass} onClick={() => ask("要新增一场活动吗？", () => insertEvent(onChange, onSelect))}>
          加一场活动
        </button>
      </div>
    </FormShell>
  );
}

function insertGame(onChange: (next: SiteDraft | ((current: SiteDraft) => SiteDraft)) => void, onSelect: (id: string) => void) {
  const id = `box-${Date.now()}`;
  onChange((current) => ({
    ...current,
    games: [...current.games, { id, name: "新桌游", players: "2–6 人", kind: "party", blurb: "", borrowable: false, emoji: "🎲", teachUrl: "", coverUrl: "", showPlay: false, showTeach: true }],
  }));
  onSelect(`game:${id}`);
}

function insertEvent(onChange: (next: SiteDraft | ((current: SiteDraft) => SiteDraft)) => void, onSelect: (id: string) => void) {
  const id = `event-${Date.now()}`;
  onChange((current) => ({
    ...current,
    events: [
      ...current.events,
      {
        id,
        group: "club",
        title: "新活动",
        fee: "",
        place: "",
        summary: "",
        body: "",
        time: "",
        startsAt: "",
        emoji: "🎲",
        coverUrl: "",
        sessions: [{ name: "场次", signed: 0, capacity: 8 }],
      },
    ],
  }));
  onSelect(`event:${id}`);
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
      <Field label="表情">
        <input value={game.emoji} onChange={(input) => onChange({ ...game, emoji: input.target.value })} className={fieldClass} />
      </Field>
      <ImageField label="封面" value={game.coverUrl} onChange={(coverUrl) => onChange({ ...game, coverUrl })} />
      <label className="mt-4 flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={game.showPlay} onChange={(input) => onChange({ ...game, showPlay: input.target.checked })} />
        显示「立即试玩」
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={game.showTeach} onChange={(input) => onChange({ ...game, showTeach: input.target.checked })} />
        显示「观看教学」
      </label>
      <Field label="教学链接">
        <input value={game.teachUrl} onChange={(input) => onChange({ ...game, teachUrl: input.target.value })} placeholder="留空则显示即将放上" className={fieldClass} />
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
      <Field label="归属">
        <select value={event.group} onChange={(input) => onChange({ ...event, group: input.target.value as SiteEventDraft["group"] })} className={fieldClass}>
          <option value="club">社团活动</option>
          <option value="classmate">同学活动</option>
        </select>
      </Field>
      <Field label="表情">
        <input value={event.emoji} onChange={(input) => onChange({ ...event, emoji: input.target.value })} className={fieldClass} />
      </Field>
      <ImageField label="封面" value={event.coverUrl} onChange={(coverUrl) => onChange({ ...event, coverUrl })} />
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
          <button
            type="button"
            className={`${quietClass} mt-3`}
            onClick={() => onChange({ ...event, sessions: event.sessions.filter((_, i) => i !== index) })}
          >
            删除这场次
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className={`${quietClass} mt-4`}
        onClick={() => onChange({ ...event, sessions: [...event.sessions, { name: "新场次", signed: 0, capacity: 8 }] })}
      >
        加一场次
      </button>
    </>
  );
}

function LinkFields({
  links,
  onChange,
}: {
  links: SiteDraft["links"];
  onChange: (next: SiteDraft["links"]) => void;
}) {
  const rows = [
    ["email", "邮箱"],
    ["wechat", "微信"],
    ["whatsapp", "WhatsApp"],
    ["instagram", "Instagram"],
    ["form", "报名表格"],
  ] as const;
  return (
    <>
      {rows.map(([key, label]) => (
        <fieldset key={key} className="mt-4 rounded-2xl border border-stone-200 p-3">
          <legend className="px-1 text-xs font-bold text-stone-500">{label}</legend>
          <Field label="显示文字">
            <input
              value={links[key].text}
              onChange={(input) => onChange({ ...links, [key]: { ...links[key], text: input.target.value } })}
              className={fieldClass}
            />
          </Field>
          <Field label="跳转链接">
            <input
              value={links[key].href}
              onChange={(input) => onChange({ ...links, [key]: { ...links[key], href: input.target.value } })}
              placeholder="留空则不跳转"
              className={fieldClass}
            />
          </Field>
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

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("file", file);
    const res = await fetch("/api/site/image", { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      setError("照片没有传上去，请再选一次。");
      return;
    }
    const json = (await res.json()) as { url?: string };
    if (json.url) onChange(json.url);
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-bold">{label}</p>
      <input value={value} onChange={(input) => onChange(input.target.value)} placeholder="也可以直接填写图片地址" className={fieldClass} />
      <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
        上传图片
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(input) => void upload(input.target.files?.[0])}
        className="sr-only"
      />
      {busy ? <p className="mt-2 text-xs text-stone-500">上传中…</p> : null}
      {error ? <p className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}
      {value ? (
        <>
          <img src={value} alt="" className="mt-2 h-28 w-full rounded-xl object-cover" />
          <button type="button" className={`${quietClass} mt-2`} onClick={() => onChange("")}>
            去掉图片
          </button>
        </>
      ) : null}
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
