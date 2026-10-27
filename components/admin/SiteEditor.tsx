"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import GoogleFormsPanel, { type GoogleNotice } from "@/components/admin/GoogleFormsPanel";
import VisitPanel from "@/components/admin/VisitPanel";
import ClubHome from "@/components/club/ClubHome";
import LogoutButton from "@/components/LogoutButton";
import { clubContent } from "@/data/club";
import { applySiteDraft, type SiteColors, type SiteDraft, type SiteEventDraft, type SiteGameDraft, type SiteHeroCopy } from "@/data/siteDraft";
import type { JoinButton, JoinButtonStyle } from "@/lib/joinButtons";
import type { ChromeKey } from "@/data/uiChrome";
import { cssColor, fallbackColors } from "@/lib/color";
import { mergeFirstSessionSigned, parseGoogleFormId } from "@/lib/formSync";
import { moveByIndex, withOrder } from "@/lib/gameOrder";
import type { VisitSummary } from "@/lib/visitMath";

const fieldClass =
  "mt-1.5 w-full scroll-mt-28 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm";

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

export default function SiteEditor({
  initial,
  visits,
  googleConnected,
  googleMessages,
}: {
  initial: SiteDraft;
  visits: VisitSummary;
  googleConnected: boolean;
  googleMessages: GoogleNotice[];
}) {
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
      <header className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-5">
        <p className="text-sm font-black">后台</p>
        <Link href="/zh" className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-bold text-stone-800">
          回到主页
        </Link>
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
      <div className="border-b border-stone-200 bg-stone-100 px-4 py-4 sm:px-5">
        <div className="grid items-stretch gap-3 lg:grid-cols-2 lg:gap-4">
          <VisitPanel visits={visits} />
          <GoogleFormsPanel
            connected={googleConnected}
            messages={googleMessages}
            onSynced={(updates) => setDraft((current) => ({ ...current, events: mergeFirstSessionSigned(current.events, updates) }))}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className={`min-w-0 flex-1 overflow-y-auto [transform:translateZ(0)] ${pane === "edit" ? "max-lg:hidden" : ""}`}>
          <ClubHome
            content={content}
            lang="zh"
            editMode
            selected={selected}
            onSelect={choose}
            onLibraryAdd={() => ask("要新增一盒桌游吗？", () => insertGame(setDraft, choose))}
            onJoinAdd={() => ask("要新增一个按钮吗？", () => insertJoinButton(setDraft, choose))}
            onReorderGame={(id, to) => setDraft((current) => placeGame(current, id, to))}
          />
        </div>
        <aside className={`w-full shrink-0 overflow-y-auto border-l border-stone-200 bg-stone-50 lg:w-96 ${pane === "preview" ? "max-lg:hidden" : ""}`}>
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

const quietClass =
  "inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:bg-white";
const moveClass = quietClass;

function choiceClass(on: boolean) {
  return on ? "inline-flex items-center justify-center rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm" : quietClass;
}

function editorKey(selected: string | null) {
  if (!selected) return "index";
  if (selected === "about-pill" || selected === "about-title" || selected === "about-p1") return "about-block";
  return selected;
}

function shiftGames(draft: SiteDraft, from: number, to: number): SiteDraft {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return draft;
  if (from < 0 || to < 0 || from >= draft.games.length || to >= draft.games.length || from === to) return draft;
  return { ...draft, games: withOrder(moveByIndex(draft.games, from, to)) };
}

function nudgeGame(draft: SiteDraft, id: string, delta: number): SiteDraft {
  const from = draft.games.findIndex((game) => game.id === id);
  return shiftGames(draft, from, from + delta);
}

function placeGame(draft: SiteDraft, id: string, to: number): SiteDraft {
  const from = draft.games.findIndex((game) => game.id === id);
  return shiftGames(draft, from, to);
}

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
  const key = editorKey(selected);

  if (selected === "claim") {
    return (
      <FormShell title="首屏介绍" hint="这段出现在主标题和两个按钮之间，用说明文字色。第一次打开页面的欢迎窗也用这段。" scrollKey={key}>
        <HeroNav selected="claim" onSelect={onSelect} />
        <FormGroup title="文案">
          <Field label="介绍">
            <textarea rows={6} value={draft.claim} onChange={(input) => onChange({ ...draft, claim: input.target.value })} className={fieldClass} />
          </Field>
        </FormGroup>
        <FormGroup title="外观">
          <ColorFields colors={draft.colors} onChange={(colors) => onChange({ ...draft, colors })} />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "brand") {
    return (
      <FormShell title="标志和名称" hint="保存后，打开主页时的开场动画会换成这个图标和中文名。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="中文名">
            <input value={draft.name} onChange={(input) => onChange({ ...draft, name: input.target.value })} className={fieldClass} />
          </Field>
          <Field label="英文名">
            <input value={draft.enName} onChange={(input) => onChange({ ...draft, enName: input.target.value })} className={fieldClass} />
          </Field>
        </FormGroup>
        <FormGroup title="外观">
          <ImageField label="图标" value={draft.logoUrl} onChange={(logoUrl) => onChange({ ...draft, logoUrl })} />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "hero") {
    return (
      <FormShell title="主标题" hint="第一行和前后两段用主文字色。中间这段用强调色，并从左渐变到结束色。" scrollKey={key}>
        <HeroNav selected="hero" onSelect={onSelect} />
        <FormGroup title="文案">
          <Field label="第一行">
            <input value={draft.heroLines.line1} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line1: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="第二行，强调色之前">
            <input value={draft.heroLines.line2Before} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line2Before: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="第二行，强调色的字">
            <input value={draft.heroLines.line2Mark} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line2Mark: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="第二行，强调色之后">
            <input value={draft.heroLines.line2After} onChange={(input) => onChange({ ...draft, heroLines: { ...draft.heroLines, line2After: input.target.value } })} className={fieldClass} />
          </Field>
        </FormGroup>
        <FormGroup title="外观">
          <ColorFields colors={draft.colors} onChange={(colors) => onChange({ ...draft, colors })} />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "org") {
    return (
      <FormShell title="学校和名称" hint="中文名用主文字色，英文名用强调色。学校和语言行用辅助文字色。页头的标志仍在「标志和名称」里改。" scrollKey={key}>
        <HeroNav selected="org" onSelect={onSelect} />
        <FormGroup title="文案">
          <Field label="所属学校或组织">
            <input value={draft.heroCopy.school} onChange={(input) => onChange(patchHeroCopy(draft, { school: input.target.value }))} className={fieldClass} />
          </Field>
          <Field label="可替换标签">
            <input value={draft.heroCopy.replaceTag} onChange={(input) => onChange(patchHeroCopy(draft, { replaceTag: input.target.value }))} placeholder="留空则不显示" className={fieldClass} />
          </Field>
          <Field label="中文名">
            <input value={draft.name} onChange={(input) => onChange({ ...draft, name: input.target.value })} className={fieldClass} />
          </Field>
          <Field label="英文名">
            <input value={draft.enName} onChange={(input) => onChange({ ...draft, enName: input.target.value })} className={fieldClass} />
          </Field>
          <Field label="语言">
            <input value={draft.heroCopy.langLine} onChange={(input) => onChange(patchHeroCopy(draft, { langLine: input.target.value }))} className={fieldClass} />
          </Field>
        </FormGroup>
        <FormGroup title="外观">
          <ColorFields colors={draft.colors} onChange={(colors) => onChange({ ...draft, colors })} />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "cta") {
    return (
      <FormShell title="报名按钮" hint="页头按钮和活动详情里的报名按钮共用「页头报名」这句。跳转链接仍在加入我们里的报名表格。" scrollKey={key}>
        <HeroNav selected="cta" onSelect={onSelect} />
        <FormGroup title="文案">
          <Field label="主按钮">
            <input value={draft.heroCopy.signupEvent} onChange={(input) => onChange(patchHeroCopy(draft, { signupEvent: input.target.value }))} className={fieldClass} />
          </Field>
          <Field label="次按钮">
            <input value={draft.heroCopy.learnMore} onChange={(input) => onChange(patchHeroCopy(draft, { learnMore: input.target.value }))} className={fieldClass} />
          </Field>
          <Field label="页头报名">
            <input value={draft.heroCopy.signup} onChange={(input) => onChange(patchHeroCopy(draft, { signup: input.target.value }))} className={fieldClass} />
          </Field>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "about") {
    return (
      <FormShell title="关于正文" hint="这段是关于区的第二段，用说明文字色。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="正文">
            <textarea rows={8} value={draft.about} onChange={(input) => onChange({ ...draft, about: input.target.value })} className={fieldClass} />
          </Field>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "about-pill" || selected === "about-title" || selected === "about-p1") {
    return (
      <FormShell title="关于" hint="小标题、标题和第一段出现在关于区上方。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="小标题">
            <input value={draft.sections.aboutPill} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, aboutPill: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="标题">
            <input value={draft.sections.aboutTitle} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, aboutTitle: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="第一段">
            <textarea rows={5} value={draft.sections.aboutP1} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, aboutP1: input.target.value } })} className={fieldClass} />
          </Field>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "about-photo") {
    return (
      <FormShell title="社团照片" hint="照片和说明出现在关于区右侧。" scrollKey={key}>
        <FormGroup title="文案">
          <ChromeFields draft={draft} onChange={onChange} rows={[["photo", "照片说明"]]} />
        </FormGroup>
        <FormGroup title="外观">
          <ImageField label="图片" value={draft.photoUrl} onChange={(photoUrl) => onChange({ ...draft, photoUrl })} />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "games-copy") {
    return (
      <FormShell title="桌游区文字" hint="这些字用在主页桌游区和教学库。按钮上的字也在这里改。" scrollKey={key}>
        <FormGroup title="文案">
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
          <ChromeFields
            draft={draft}
            onChange={onChange}
            rows={[
              ["gamesMore", "更多桌游"],
              ["shelfPrev", "上一盒"],
              ["shelfNext", "下一盒"],
              ["shelfHint", "滑动提示"],
              ["play", "立即试玩"],
              ["teach", "观看教学"],
              ["borrow", "预约借用"],
              ["kindParty", "类型：派对"],
              ["kindStrategy", "类型：策略"],
              ["kindDeduce", "类型：推理阵营"],
              ["kindOther", "类型：其他"],
              ["libraryBack", "教学库返回"],
              ["search", "搜索提示"],
              ["empty", "没有结果"],
              ["filterAll", "全部"],
              ["teachSoon", "教学即将放上"],
            ]}
          />
        </FormGroup>
        <FormGroup title="顺序/删除">
          <button type="button" className={`${quietClass} mt-3`} onClick={() => onSelect("games-order")}>
            调整货架顺序
          </button>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "games-order") {
    return (
      <FormShell title="桌游库顺序" hint="主页预览里按住一张卡左右拖，就是货架从左到右的顺序。下面的列表仍可拖左侧手柄，或点上移、下移。改完要点右上角保存，公开页才会换顺序。" scrollKey={key}>
        <FormGroup title="顺序/删除">
          <GameOrderList
            games={draft.games}
            onNudge={(id, delta) => onChange((current) => nudgeGame(current, id, delta))}
            onPlace={(id, to) => onChange((current) => placeGame(current, id, to))}
            onSelect={onSelect}
          />
          <button type="button" className={`${quietClass} mt-3`} onClick={() => ask("要新增一盒桌游吗？", () => insertGame(onChange, onSelect))}>
            加一盒
          </button>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "news-copy") {
    return (
      <FormShell title="活动区文字" hint="这些字用在主页活动区的标题、分页和卡片按钮。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="小标题">
            <input value={draft.sections.newsPill} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, newsPill: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="标题">
            <input value={draft.sections.newsTitle} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, newsTitle: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="说明">
            <textarea rows={3} value={draft.sections.newsAside} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, newsAside: input.target.value } })} className={fieldClass} />
          </Field>
          <ChromeFields
            draft={draft}
            onChange={onChange}
            rows={[
              ["tabClub", "社团活动"],
              ["tabClass", "同学活动"],
              ["sessions", "场次标题"],
              ["openEvent", "报名按钮"],
              ["openEnded", "回顾按钮"],
              ["endedBar", "已结束横条"],
              ["fee", "费用"],
              ["time", "时间"],
              ["place", "地点"],
              ["countNote", "名额占位"],
              ["cardReplace", "整张可替换"],
            ]}
          />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected?.startsWith("join-button:")) {
    const activeId = selected.slice("join-button:".length);
    const button = draft.joinButtons.find((item) => item.id === activeId);
    if (button) {
      const index = draft.joinButtons.findIndex((item) => item.id === button.id);
      const label = button.text.trim() || "这个按钮";
      return (
        <FormShell title={button.text.trim() || "按钮"} hint="点预览里的另一颗按钮会换到那一颗，不会跳走。要看网址，用「打开链接」。" scrollKey={key}>
          <JoinButtonSwitcher buttons={draft.joinButtons} activeId={button.id} onSelect={onSelect} />
          <JoinButtonEditor
            key={button.id}
            button={button}
            onChange={(patch) =>
              onChange((current) => ({
                ...current,
                joinButtons: current.joinButtons.map((item) => (item.id === button.id ? { ...item, ...patch } : item)),
              }))
            }
          />
          <FormGroup title="顺序/删除">
            <p className="mt-2 text-xs leading-relaxed text-stone-500">从左到右第 {index + 1} 颗</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={moveClass} disabled={index <= 0} aria-label={`上移「${label}」`} onClick={() => onChange((current) => ({ ...current, joinButtons: moveJoinButtons(current.joinButtons, button.id, -1) }))}>
                上移
              </button>
              <button
                type="button"
                className={moveClass}
                disabled={index < 0 || index >= draft.joinButtons.length - 1}
                aria-label={`下移「${label}」`}
                onClick={() => onChange((current) => ({ ...current, joinButtons: moveJoinButtons(current.joinButtons, button.id, 1) }))}
              >
                下移
              </button>
              <button type="button" className={quietClass} onClick={() => ask("要新增一个按钮吗？", () => insertJoinButton(onChange, onSelect))}>
                加一个按钮
              </button>
              <button
                type="button"
                className={quietClass}
                onClick={() =>
                  ask(`要删除「${label}」吗？`, () => {
                    const next = draft.joinButtons.filter((item) => item.id !== button.id);
                    const neighbor = next[index] ?? next[index - 1];
                    onChange((current) => ({ ...current, joinButtons: current.joinButtons.filter((item) => item.id !== button.id) }));
                    onSelect(neighbor ? `join-button:${neighbor.id}` : "join");
                  })
                }
              >
                删除这个按钮
              </button>
            </div>
          </FormGroup>
        </FormShell>
      );
    }
  }

  if (selected === "join" || selected?.startsWith("join-button:")) {
    return (
      <FormShell title="加入我们" hint="原来的邮箱、微信、WhatsApp、Instagram 和报名表格还连着页头图标、联系页和页头报名。删掉其中一颗，对应的地方也会空掉。新加的按钮只出现在这一块。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="标题">
            <input value={draft.sections.joinTitle} onChange={(input) => onChange({ ...draft, sections: { ...draft.sections, joinTitle: input.target.value } })} className={fieldClass} />
          </Field>
          <Field label="正文">
            <textarea rows={5} value={draft.join} onChange={(input) => onChange({ ...draft, join: input.target.value })} className={fieldClass} />
          </Field>
        </FormGroup>
        <FormGroup title="顺序/删除">
          <p className="mt-2 text-xs leading-relaxed text-stone-500">点预览里的一颗按钮，或点下面的名字，只编辑这一颗。</p>
          <JoinButtonList
            buttons={draft.joinButtons}
            onSelect={onSelect}
            onMove={(id, dir) => onChange((current) => ({ ...current, joinButtons: moveJoinButtons(current.joinButtons, id, dir) }))}
          />
          <button type="button" className={`${quietClass} mt-3`} onClick={() => ask("要新增一个按钮吗？", () => insertJoinButton(onChange, onSelect))}>
            加一个按钮
          </button>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "nav") {
    return (
      <FormShell title="导航" hint="页头、页脚和欢迎窗里的栏目名共用这几句。手机上的菜单按钮读「菜单」。" scrollKey={key}>
        <FormGroup title="文案">
          <ChromeFields
            draft={draft}
            onChange={onChange}
            rows={[
              ["navHome", "首页"],
              ["navAbout", "关于我们"],
              ["navGames", "桌游库"],
              ["navNews", "最新消息"],
              ["navJoin", "加入我们"],
              ["menu", "菜单"],
            ]}
          />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "footer") {
    return (
      <FormShell title="页脚" hint="社团名用标志里的中文名。关于我们、桌游库、加入我们用导航里的字。英文页仍显示这行原文。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="版权行">
            <textarea rows={3} value={draft.footer} onChange={(input) => onChange({ ...draft, footer: input.target.value })} className={fieldClass} />
          </Field>
          <button type="button" className={`${quietClass} mt-3`} onClick={() => onSelect("nav")}>
            改导航文字
          </button>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "next") {
    return (
      <FormShell title="下一场" hint="右上角这张卡只出现在还没开始的最近一场。标题和时间来自那场活动。" scrollKey={key}>
        <FormGroup title="文案">
          <ChromeFields
            draft={draft}
            onChange={onChange}
            rows={[
              ["nextLabel", "小标题"],
              ["nextOpen", "查看按钮"],
              ["nextDay", "天"],
              ["nextHour", "时"],
              ["nextMin", "分"],
              ["nextSec", "秒"],
              ["nextDismiss", "收起"],
            ]}
          />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "welcome") {
    return (
      <FormShell title="欢迎窗" hint="正文和首屏介绍是同一段。第一次打开主页时出现。" scrollKey={key}>
        <FormGroup title="文案">
          <ChromeFields
            draft={draft}
            onChange={onChange}
            rows={[
              ["welcomeTitle", "标题"],
              ["welcomeClose", "关闭"],
            ]}
          />
          <button type="button" className={`${quietClass} mt-3`} onClick={() => onSelect("claim")}>
            改这段介绍
          </button>
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "topics") {
    return (
      <FormShell title="破冰话题" hint="点桌游上的「立即试玩」会打开这个窗。保存时去掉空行。英文页仍显示这些话题原文。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="话题，一行一条">
            <textarea
              rows={10}
              value={draft.topics.join("\n")}
              onChange={(input) => onChange({ ...draft, topics: input.target.value.split("\n") })}
              className={fieldClass}
            />
          </Field>
          <ChromeFields
            draft={draft}
            onChange={onChange}
            rows={[
              ["iceTitle", "标题"],
              ["iceLead", "说明"],
              ["iceDraw", "立即抽签"],
              ["iceDrawing", "抽签中"],
              ["iceAgain", "再抽一次"],
            ]}
          />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "borrow") {
    return (
      <FormShell title="预约借用" hint="点可借用桌游上的「预约借用」会打开这个窗。缺姓名、时间不对这类提示是系统文字，不在这里改。" scrollKey={key}>
        <FormGroup title="文案">
          <Field label="借用规则">
            <textarea rows={6} value={draft.borrowRules} onChange={(input) => onChange({ ...draft, borrowRules: input.target.value })} className={fieldClass} />
          </Field>
          <ChromeFields
            draft={draft}
            onChange={onChange}
            rows={[
              ["borrowClear", "可预约说明"],
              ["borrowName", "姓名"],
              ["borrowId", "学号"],
              ["borrowPhone", "电话"],
              ["borrowEmail", "邮箱"],
              ["borrowStart", "开始时间"],
              ["borrowEnd", "归还时间"],
              ["borrowNote", "备注"],
              ["borrowOptional", "选填"],
              ["borrowSubmit", "提交"],
              ["borrowSaved", "已提交"],
              ["borrowLocal", "未写入后台"],
              ["close", "关闭"],
            ]}
          />
        </FormGroup>
      </FormShell>
    );
  }

  if (selected === "colors") {
    return (
      <FormShell title="全站颜色" hint="这些颜色用在首屏、关于、桌游和活动区。深色区块上的白字保持白色。" scrollKey={key}>
        <FormGroup title="外观">
          <ColorFields colors={draft.colors} onChange={(colors) => onChange({ ...draft, colors })} />
        </FormGroup>
      </FormShell>
    );
  }

  if (game) {
    const index = draft.games.findIndex((item) => item.id === game.id);
    const label = game.name.trim() || "这盒桌游";
    return (
      <FormShell title={game.name || "桌游"} hint={`货架从左到右第 ${index + 1} 位。预览里拖动卡片也是改这个顺序。改完要点右上角保存，公开页才会换内容和顺序。`} scrollKey={key}>
        <GameFields game={game} onChange={(next) => onChange({ ...draft, games: draft.games.map((item) => (item.id === game.id ? next : item)) })} />
        <FormGroup title="顺序/删除">
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={moveClass} disabled={index <= 0} aria-label={`上移「${label}」`} onClick={() => onChange((current) => nudgeGame(current, game.id, -1))}>
              上移
            </button>
            <button
              type="button"
              className={moveClass}
              disabled={index < 0 || index >= draft.games.length - 1}
              aria-label={`下移「${label}」`}
              onClick={() => onChange((current) => nudgeGame(current, game.id, 1))}
            >
              下移
            </button>
            <button type="button" className={quietClass} onClick={() => onSelect("games-order")}>
              全部顺序
            </button>
            <button type="button" className={quietClass} onClick={() => ask("要新增一盒桌游吗？", () => insertGame(onChange, onSelect))}>
              加一盒
            </button>
            <button
              type="button"
              className={quietClass}
              onClick={() =>
                ask(`要删除「${label}」吗？`, () => {
                  onChange((current) => ({ ...current, games: withOrder(current.games.filter((item) => item.id !== game.id)) }));
                  onSelect(null);
                })
              }
            >
              删除这盒
            </button>
          </div>
        </FormGroup>
      </FormShell>
    );
  }

  if (event) {
    return (
      <FormShell title={event.title || "活动"} hint="卡片上的字、报名链接和封面都在这里。改完要点右上角保存。" scrollKey={key}>
        <EventFields key={event.id} event={event} onChange={(next) => onChange({ ...draft, events: draft.events.map((item) => (item.id === event.id ? next : item)) })} />
        <FormGroup title="顺序/删除">
          <div className="mt-3 flex flex-wrap gap-2">
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
        </FormGroup>
      </FormShell>
    );
  }

  return (
    <FormShell title="选择一块" hint="点预览里的一块文字，或从下面进入。每一项对应主页上的一块。" scrollKey={key}>
      <FormGroup title="文案">
        <JumpList
          items={[
            ["hero", "主标题"],
            ["org", "学校和名称"],
            ["claim", "首屏介绍"],
            ["cta", "报名按钮"],
            ["nav", "导航"],
            ["about-pill", "关于"],
            ["about", "关于正文"],
            ["games-copy", "桌游区文字"],
            ["news-copy", "活动区文字"],
            ["join", "加入我们"],
            ["footer", "页脚"],
            ["next", "下一场"],
            ["welcome", "欢迎窗"],
            ["topics", "破冰话题"],
            ["borrow", "预约借用"],
          ]}
          onSelect={onSelect}
        />
      </FormGroup>
      <FormGroup title="外观">
        <JumpList
          items={[
            ["colors", "全站颜色"],
            ["brand", "标志和名称"],
            ["about-photo", "社团照片"],
          ]}
          onSelect={onSelect}
        />
      </FormGroup>
      <FormGroup title="顺序/删除">
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className={`${quietClass} min-h-10`} onClick={() => onSelect("games-order")}>
            桌游库顺序
          </button>
          <button type="button" className={`${quietClass} min-h-10`} onClick={() => ask("要新增一盒桌游吗？", () => insertGame(onChange, onSelect))}>
            加一盒桌游
          </button>
          <button type="button" className={`${quietClass} min-h-10`} onClick={() => ask("要新增一场活动吗？", () => insertEvent(onChange, onSelect))}>
            加一场活动
          </button>
        </div>
      </FormGroup>
    </FormShell>
  );
}

function insertJoinButton(onChange: (next: SiteDraft | ((current: SiteDraft) => SiteDraft)) => void, onSelect: (id: string) => void) {
  const id = `btn-${Date.now().toString(36)}`;
  onChange((current) => ({
    ...current,
    joinButtons: [
      ...current.joinButtons,
      { id, slot: "", text: "新按钮", href: "", style: "solid", color: "#4f46e5", colorMid: "", colorEnd: "", textColor: "#ffffff" },
    ],
  }));
  onSelect(`join-button:${id}`);
}

function insertGame(onChange: (next: SiteDraft | ((current: SiteDraft) => SiteDraft)) => void, onSelect: (id: string) => void) {
  const id = `box-${Date.now()}`;
  onChange((current) => ({
    ...current,
    games: withOrder([...current.games, { id, name: "新桌游", players: "2–6 人", kind: "party", blurb: "", borrowable: false, emoji: "🎲", teachUrl: "", coverUrl: "", showPlay: false, showTeach: true }]),
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
        signupUrl: "",
        formId: "",
        sessions: [{ name: "场次", signed: 0, capacity: 8 }],
      },
    ],
  }));
  onSelect(`event:${id}`);
}

function GameFields({ game, onChange }: { game: SiteGameDraft; onChange: (next: SiteGameDraft) => void }) {
  return (
    <>
      <FormGroup title="文案">
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
      </FormGroup>
      <FormGroup title="链接">
        <Field label="教学链接">
          <input value={game.teachUrl} onChange={(input) => onChange({ ...game, teachUrl: input.target.value })} placeholder="留空则显示即将放上" className={fieldClass} />
        </Field>
      </FormGroup>
      <FormGroup title="外观">
        <ImageField label="封面" value={game.coverUrl} onChange={(coverUrl) => onChange({ ...game, coverUrl })} />
        <CheckRow label="显示「立即试玩」" checked={game.showPlay} onChange={(showPlay) => onChange({ ...game, showPlay })} />
        <CheckRow label="显示「观看教学」" checked={game.showTeach} onChange={(showTeach) => onChange({ ...game, showTeach })} />
        <CheckRow label="可以预约借用" checked={game.borrowable} onChange={(borrowable) => onChange({ ...game, borrowable })} />
      </FormGroup>
    </>
  );
}

function EventFields({ event, onChange }: { event: SiteEventDraft; onChange: (next: SiteEventDraft) => void }) {
  const [formHint, setFormHint] = useState("");

  function updateFormId(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setFormHint("");
      onChange({ ...event, formId: "" });
      return;
    }
    const parsed = parseGoogleFormId(trimmed);
    if (parsed) {
      setFormHint(parsed === trimmed ? "" : "已读出表单编号。先保存，再同步。");
      onChange({ ...event, formId: parsed });
      return;
    }
    if (/\/forms\/d\/e\//i.test(trimmed) || /viewform/i.test(trimmed)) {
      setFormHint("这是公开报名链接。同步请粘贴编辑链接，形如 …/forms/d/编号/edit。");
      return;
    }
    if (/https?:|docs\.google|\/forms\//i.test(trimmed)) {
      setFormHint("没能从这段链接里读出表单编号。请粘贴编辑链接。");
      return;
    }
    setFormHint("");
    onChange({ ...event, formId: trimmed.replace(/\s+/g, "").slice(0, 128) });
  }

  return (
    <>
      <FormGroup title="文案">
        <Field label="归属">
          <select value={event.group} onChange={(input) => onChange({ ...event, group: input.target.value as SiteEventDraft["group"] })} className={fieldClass}>
            <option value="club">社团活动</option>
            <option value="classmate">同学活动</option>
          </select>
        </Field>
        <Field label="表情">
          <input value={event.emoji} onChange={(input) => onChange({ ...event, emoji: input.target.value })} className={fieldClass} />
        </Field>
        <Field label="开始时间">
          <input
            type="datetime-local"
            value={localStart(event.startsAt)}
            onChange={(input) => onChange({ ...event, startsAt: input.target.value ? `${input.target.value}:00+08:00` : "" })}
            className={fieldClass}
          />
        </Field>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-500">开始时间一过，卡片变成已结束；还没到的最近一场会出现在右下角。</p>
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
      </FormGroup>
      <FormGroup title="场次">
      {event.sessions.map((session, index) => (
        <fieldset key={index} className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
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
          {index === 0 && parseGoogleFormId(event.formId) ? (
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {event.sessions.length > 1 ? "同步时，回复数只写入这一场的已报。后面的场次仍用手填。" : "同步时，回复数会写入这里的已报。"}
            </p>
          ) : null}
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
        className={`${quietClass} mt-3`}
        onClick={() => onChange({ ...event, sessions: [...event.sessions, { name: "新场次", signed: 0, capacity: 8 }] })}
      >
        加一场次
      </button>
      </FormGroup>
      <FormGroup title="链接">
        <Field label="报名链接">
          <input value={event.signupUrl} onChange={(input) => onChange({ ...event, signupUrl: input.target.value })} placeholder="只用于这场详细资料里的立即报名" className={fieldClass} />
        </Field>
        <Field label="同步用的表单编号">
          <input
            id="sync-form-id"
            value={event.formId}
            onChange={(input) => updateFormId(input.target.value)}
            placeholder="表单编号，或粘贴 …/forms/d/编号/edit"
            spellCheck={false}
            className={fieldClass}
          />
        </Field>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
          用来把 Google 表单的回复数写入第一场的已报。请填编辑编号，或粘贴编辑链接。这不是给访客看的报名链接。留空则这场继续用手填人数。改完请先保存，再点「同步报名人数」。
        </p>
        {formHint ? <p className="mt-1.5 text-xs font-bold text-amber-700">{formHint}</p> : null}
      </FormGroup>
      <FormGroup title="外观">
        <ImageField label="封面" value={event.coverUrl} onChange={(coverUrl) => onChange({ ...event, coverUrl })} />
      </FormGroup>
    </>
  );
}

function moveJoinButtons(buttons: JoinButton[], id: string, dir: -1 | 1) {
  const index = buttons.findIndex((button) => button.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= buttons.length) return buttons;
  const next = buttons.slice();
  const [item] = next.splice(index, 1);
  if (!item) return buttons;
  next.splice(target, 0, item);
  return next;
}

function JoinButtonSwitcher({
  buttons,
  activeId,
  onSelect,
}: {
  buttons: JoinButton[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={choiceClass(false)} onClick={() => onSelect("join")}>
        标题和正文
      </button>
      {buttons.map((button) => (
        <button
          key={button.id}
          type="button"
          onClick={() => onSelect(`join-button:${button.id}`)}
          className={choiceClass(button.id === activeId)}
        >
          {button.text.trim() || "未命名按钮"}
        </button>
      ))}
    </div>
  );
}

function JoinButtonList({
  buttons,
  onSelect,
  onMove,
}: {
  buttons: JoinButton[];
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  if (!buttons.length) return <p className="mt-3 text-sm text-stone-500">还没有按钮。</p>;
  return (
    <ol className="mt-3 space-y-2" aria-label="加入我们的按钮">
      {buttons.map((button, index) => {
        const label = button.text.trim() || "未命名按钮";
        return (
          <li key={button.id} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2">
            <button type="button" onClick={() => onSelect(`join-button:${button.id}`)} className="min-h-11 min-w-0 flex-1 truncate text-left text-sm font-bold">
              <span className="mr-2 text-xs font-bold text-stone-400 tabular-nums">{index + 1}</span>
              {label}
            </button>
            <button type="button" className={moveClass} disabled={index === 0} aria-label={`上移「${label}」`} onClick={() => onMove(button.id, -1)}>
              上移
            </button>
            <button type="button" className={moveClass} disabled={index === buttons.length - 1} aria-label={`下移「${label}」`} onClick={() => onMove(button.id, 1)}>
              下移
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function JoinButtonEditor({ button, onChange }: { button: JoinButton; onChange: (patch: Partial<JoinButton>) => void }) {
  useEffect(() => {
    const field = document.getElementById(`join-button-text-${button.id}`);
    if (field instanceof HTMLInputElement) field.focus();
  }, [button.id]);

  return (
    <>
      <FormGroup title="文案">
        <Field label="显示文字">
          <input
            id={`join-button-text-${button.id}`}
            value={button.text}
            onChange={(input) => onChange({ text: input.target.value })}
            className={fieldClass}
          />
        </Field>
      </FormGroup>
      <FormGroup title="链接">
        <Field label="跳转链接">
          <input
            value={button.href}
            onChange={(input) => onChange({ href: input.target.value })}
            placeholder="留空则不跳转"
            spellCheck={false}
            className={fieldClass}
          />
        </Field>
        <button
          type="button"
          className={`${quietClass} mt-3`}
          disabled={!button.href.trim()}
          onClick={() => {
            const href = button.href.trim();
            if (!href) return;
            window.open(href, "_blank", "noopener,noreferrer");
          }}
        >
          打开链接
        </button>
      </FormGroup>
      <FormGroup title="外观">
        <Field label="样式">
          <select
            value={button.style}
            onChange={(input) => {
              const style = input.target.value as JoinButtonStyle;
              onChange({
                style,
                colorEnd: style === "gradient" && !button.colorEnd ? "#fb923c" : button.colorEnd,
              });
            }}
            className={fieldClass}
          >
            <option value="solid">纯色</option>
            <option value="gradient">渐变</option>
            <option value="glass">半透明</option>
          </select>
        </Field>
        {button.style === "gradient" ? (
          <>
            <ColorField label="起始色" hint="从左到右的第一色" value={button.color} fallback="#a855f7" onChange={(color) => onChange({ color })} />
            <ColorField label="中间色" hint="留空则只有两端" value={button.colorMid} fallback="#ec4899" clearable onChange={(colorMid) => onChange({ colorMid })} />
            <ColorField label="结束色" hint="从左到右的最后一色" value={button.colorEnd} fallback="#fb923c" onChange={(colorEnd) => onChange({ colorEnd })} />
          </>
        ) : (
          <ColorField
            label="背景色"
            hint={button.style === "glass" ? "淡淡铺在深色底上" : "按钮的底色"}
            value={button.color}
            fallback={button.style === "glass" ? "#ffffff" : "#4f46e5"}
            onChange={(color) => onChange({ color })}
          />
        )}
        <ColorField label="文字色" hint="按钮上的字" value={button.textColor} fallback="#ffffff" onChange={(textColor) => onChange({ textColor })} />
      </FormGroup>
    </>
  );
}

function HeroNav({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const items = [
    ["hero", "主标题"],
    ["org", "学校和名称"],
    ["claim", "介绍"],
    ["cta", "按钮"],
  ] as const;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([id, label]) => (
        <button key={id} type="button" onClick={() => onSelect(id)} className={choiceClass(selected === id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function patchHeroCopy(draft: SiteDraft, patch: Partial<SiteHeroCopy>): SiteDraft {
  return { ...draft, heroCopy: { ...draft.heroCopy, ...patch } };
}

function setChrome(draft: SiteDraft, patch: Partial<SiteDraft["chrome"]>): SiteDraft {
  return { ...draft, chrome: { ...draft.chrome, ...patch } };
}

function ChromeFields({
  draft,
  rows,
  onChange,
}: {
  draft: SiteDraft;
  rows: readonly (readonly [ChromeKey, string])[];
  onChange: (next: SiteDraft) => void;
}) {
  return (
    <>
      {rows.map(([key, label]) => (
        <Field key={key} label={label}>
          <input value={draft.chrome[key]} onChange={(input) => onChange(setChrome(draft, { [key]: input.target.value }))} className={fieldClass} />
        </Field>
      ))}
    </>
  );
}

function ColorFields({ colors, onChange }: { colors: SiteColors; onChange: (next: SiteColors) => void }) {
  return (
    <>
      <ColorField label="主文字" hint="首屏标题、中文名、关于和活动区的大标题" value={colors.text} fallback={fallbackColors.text} onChange={(text) => onChange({ ...colors, text })} />
      <ColorField label="强调" hint="英文名、桌游区小标题、活动费用，以及强调词的起始色" value={colors.accent} fallback={fallbackColors.accent} onChange={(accent) => onChange({ ...colors, accent })} />
      <ColorField label="强调渐变" hint="强调词和报名进度条从左到右的结束色" value={colors.accentEnd} fallback={fallbackColors.accentEnd} onChange={(accentEnd) => onChange({ ...colors, accentEnd })} />
      <ColorField label="说明文字" hint="首屏介绍、关于两段、活动摘要" value={colors.body} fallback={fallbackColors.body} onChange={(body) => onChange({ ...colors, body })} />
      <ColorField label="辅助文字" hint="学校和语言行、活动区说明、页脚版权行" value={colors.meta} fallback={fallbackColors.meta} onChange={(meta) => onChange({ ...colors, meta })} />
      <p className="mt-3 text-xs leading-relaxed text-stone-500">用 #RRGGBB。不是这种格式的值在保存时会被忽略。深色区块上的白字保持白色，避免主文字色融进背景。</p>
    </>
  );
}

function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
  clearable = false,
}: {
  label: string;
  hint: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
  clearable?: boolean;
}) {
  return (
    <div className="mt-3">
      <label className="block text-sm font-bold text-stone-800">
        {label}
        <span className="mt-0.5 block text-xs font-normal text-stone-500">{hint}</span>
        <span className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={cssColor(value, fallback)}
            onChange={(input) => onChange(input.target.value)}
            className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-stone-200 bg-white p-1"
            aria-label={label}
          />
          <input value={value} onChange={(input) => onChange(input.target.value)} spellCheck={false} className={`${fieldClass} mt-0 font-mono`} />
        </span>
      </label>
      {clearable && value ? (
        <button type="button" className={`${quietClass} mt-2`} onClick={() => onChange("")}>
          去掉中间色
        </button>
      ) : null}
    </div>
  );
}

function GameOrderList({
  games,
  onNudge,
  onPlace,
  onSelect,
}: {
  games: SiteGameDraft[];
  onNudge: (id: string, delta: -1 | 1) => void;
  onPlace: (id: string, to: number) => void;
  onSelect: (id: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);

  function focusHandle(id: string) {
    requestAnimationFrame(() => {
      document.getElementById(`game-order-${id}`)?.focus();
    });
  }

  function nudge(id: string, delta: -1 | 1) {
    const from = games.findIndex((game) => game.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= games.length) return;
    onNudge(id, delta);
    focusHandle(id);
  }

  function place(id: string, to: number) {
    const from = games.findIndex((game) => game.id === id);
    if (from < 0 || from === to || to < 0 || to >= games.length) return;
    onPlace(id, to);
    focusHandle(id);
  }

  if (!games.length) return <p className="mt-3 text-sm text-stone-600">还没有桌游。</p>;

  return (
    <ol className="mt-3 space-y-2" aria-label="桌游库从左到右的顺序">
      {games.map((game, index) => {
        const label = game.name.trim() || "未命名";
        const active = over === index && dragging !== null && dragging !== game.id;
        return (
          <li
            key={game.id}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOver((current) => (current === index ? current : index));
            }}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain") || dragging || "";
              setDragging(null);
              setOver(null);
              if (id) place(id, index);
            }}
            className={`flex items-center gap-2 rounded-xl border bg-stone-50 p-2 transition ${active ? "border-indigo-400 bg-white ring-4 ring-indigo-100" : "border-stone-200"} ${dragging === game.id ? "opacity-60" : ""}`}
          >
            <button
              id={`game-order-${game.id}`}
              type="button"
              draggable
              aria-label={`拖动「${label}」。上下方向键也可以调整顺序。`}
              title="拖动排序"
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", game.id);
                setDragging(game.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  nudge(game.id, -1);
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  nudge(game.id, 1);
                }
              }}
              className="grid shrink-0 cursor-grab grid-cols-2 gap-0.5 rounded-xl px-1.5 py-2 text-stone-400 active:cursor-grabbing"
            >
              {Array.from({ length: 6 }, (_, dot) => (
                <span key={dot} className="h-1 w-1 rounded-full bg-current" />
              ))}
            </button>
            <button type="button" onClick={() => onSelect(`game:${game.id}`)} className="min-w-0 flex-1 truncate text-left text-sm font-bold">
              <span className="mr-2 text-xs font-bold text-stone-400 tabular-nums">{index + 1}</span>
              <span aria-hidden className="mr-1">
                {game.emoji}
              </span>
              {label}
            </button>
            <button type="button" className={moveClass} disabled={index === 0} aria-label={`上移「${label}」`} onClick={() => nudge(game.id, -1)}>
              上移
            </button>
            <button type="button" className={moveClass} disabled={index === games.length - 1} aria-label={`下移「${label}」`} onClick={() => nudge(game.id, 1)}>
              下移
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function FormShell({ title, hint, scrollKey, children }: { title: string; hint?: string; scrollKey: string; children: ReactNode }) {
  const head = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = head.current?.closest("aside");
    if (scroller instanceof HTMLElement) scroller.scrollTop = 0;
  }, [scrollKey]);

  return (
    <div ref={head} key={scrollKey} className="editor-pane px-4 pb-8 sm:px-5">
      <header className="sticky top-0 z-10 -mx-4 border-b border-stone-200/80 bg-stone-50/95 px-4 pt-5 pb-4 backdrop-blur-sm sm:-mx-5 sm:px-5">
        <h2 className="text-lg font-black tracking-tight text-stone-950">
          <span className="mb-1 block text-[11px] font-bold text-indigo-600">当前编辑</span>
          {title}
        </h2>
        {hint ? <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{hint}</p> : null}
      </header>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <h3 className="text-xs font-bold text-stone-500">{title}</h3>
      {children}
    </section>
  );
}

function JumpList({ items, onSelect }: { items: readonly (readonly [string, string])[]; onSelect: (id: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {items.map(([id, label]) => (
        <button key={id} type="button" className={`${quietClass} min-h-10`} onClick={() => onSelect(id)}>
          {label}
        </button>
      ))}
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
    <div className="mt-3">
      <p className="text-sm font-bold text-stone-800">{label}</p>
      <input value={value} onChange={(input) => onChange(input.target.value)} placeholder="也可以直接填写图片地址" className={fieldClass} />
      <button type="button" onClick={() => fileRef.current?.click()} className={`${quietClass} mt-2 min-h-11 w-full`}>
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
    <label className="mt-3 block text-sm font-bold text-stone-800">
      {label}
      {children}
    </label>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label className="mt-3 flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold text-stone-800">
      <input type="checkbox" checked={checked} onChange={(input) => onChange(input.target.checked)} className="size-4 accent-indigo-600" />
      {label}
    </label>
  );
}
