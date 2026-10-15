"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import DiceCursor from "@/components/club/DiceCursor";
import HeroDots from "@/components/club/HeroDots";
import type { ClubContent, ClubEvent, ClubGame, GameKind } from "@/data/club";
import type { Lang } from "@/lib/types";

function LocalLabLink() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const host = window.location.hostname;
    setShow(host === "localhost" || host === "127.0.0.1");
  }, []);
  if (!show) return null;
  return (
    <Link
      href="/preview"
      className="fixed bottom-4 left-4 z-[70] rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-orange-300 shadow-lg ring-1 ring-orange-400/40"
    >
      本地实验
    </Link>
  );
}

const WELCOME_KEY = "aroma-welcome";
const NEXT_DISMISS_KEY = "aroma-next-dismiss";
const LANGS: { id: Lang; label: string }[] = [
  { id: "zh", label: "简" },
  { id: "zh-Hant", label: "繁" },
  { id: "en", label: "EN" },
];
const HEX = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#14b8a6", "#6366f1", "#fb7185"];
const KIND_CLASS: Record<GameKind, string> = {
  party: "bg-red-500/20 text-red-200",
  strategy: "bg-blue-500/20 text-blue-200",
  deduce: "bg-amber-500/20 text-amber-200",
  other: "bg-slate-600 text-slate-100",
};

type Modal =
  | null
  | { type: "ice" }
  | { type: "teach"; id: string }
  | { type: "borrow"; id: string }
  | { type: "event"; id: string };

type BorrowForm = {
  name: string;
  sid: string;
  phone: string;
  email: string;
  start: string;
  end: string;
  note: string;
};

const emptyForm: BorrowForm = { name: "", sid: "", phone: "", email: "", start: "", end: "", note: "" };

function withLang(pathname: string, lang: Lang) {
  const parts = pathname.split("/");
  parts[1] = lang;
  return parts.join("/") || `/${lang}`;
}

function useInview() {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setShown(true);
      },
      { threshold: 0.18 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, shown };
}

export default function ClubHome({
  content,
  lang,
  editMode = false,
  selected = null,
  onSelect,
  onLibraryAdd,
}: {
  content: ClubContent;
  lang: Lang;
  editMode?: boolean;
  selected?: string | null;
  onSelect?: (id: string) => void;
  onLibraryAdd?: () => void;
}) {
  const ui = content.ui;
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [splash, setSplash] = useState<"show" | "out" | "off">(editMode ? "off" : "show");
  const [welcome, setWelcome] = useState(false);
  const [library, setLibrary] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | GameKind>("all");
  const [group, setGroup] = useState<"club" | "classmate">("club");
  useEffect(() => {
    if (group === "classmate" && !content.events.some((item) => item.group === "classmate")) setGroup("club");
  }, [content.events, group]);
  const [slide, setSlide] = useState<"from-left" | "from-right" | "">("");
  const [modal, setModal] = useState<Modal>(null);
  const [topic, setTopic] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [form, setForm] = useState<BorrowForm>(emptyForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [borrowOk, setBorrowOk] = useState(false);
  const [nextHidden, setNextHidden] = useState(false);
  const shelfRef = useRef<HTMLDivElement>(null);
  const about = useInview();
  const games = useInview();
  const titleId = useId();

  useEffect(() => {
    setNextHidden(window.sessionStorage.getItem(NEXT_DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    if (editMode) {
      setSplash("off");
      setWelcome(false);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const openWelcome = () => {
      if (window.localStorage.getItem(WELCOME_KEY) !== "1") setWelcome(true);
    };
    if (reduced) {
      setSplash("off");
      openWelcome();
      return;
    }
    const fade = window.setTimeout(() => setSplash("out"), 1100);
    const done = window.setTimeout(() => {
      setSplash("off");
      openWelcome();
    }, 1520);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, [editMode]);

  const locked = splash !== "off" || welcome || library || modal !== null;
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        setLibrary(false);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const kindLabel: Record<GameKind, string> = {
    party: ui.kindParty,
    strategy: ui.kindStrategy,
    deduce: ui.kindDeduce,
    other: ui.kindOther,
  };
  const nextEvent = useMemo(() => {
    const now = Date.now();
    return content.events
      .filter((item) => item.group === "club" && item.startsAt && new Date(item.startsAt).getTime() > now)
      .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())[0];
  }, [content.events]);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return content.games.filter((item) => {
      const kindOk = kind === "all" || item.kind === kind;
      const textOk = !text || item.name.toLowerCase().includes(text);
      return kindOk && textOk;
    });
  }, [content.games, kind, query]);
  const visibleEvents = useMemo(() => {
    return content.events
      .filter((item) => item.group === group)
      .slice()
      .sort((a, b) => {
        const aTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const bTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [content.events, group]);
  const activeGame = modal && "id" in modal ? content.games.find((item) => item.id === modal.id) : undefined;
  const activeEvent = modal?.type === "event" ? content.events.find((item) => item.id === modal.id) : undefined;

  function dismissWelcome() {
    window.localStorage.setItem(WELCOME_KEY, "1");
    setWelcome(false);
  }

  function openHref(href: string) {
    const next = href.trim();
    if (!next) return;
    window.open(next, "_blank", "noopener,noreferrer");
  }

  function goSignup() {
    const href = content.links.form.href.trim();
    if (!href || editMode) return;
    window.location.assign(href);
  }

  function openTeach(game: ClubGame) {
    if (editMode) {
      choose(`game:${game.id}`);
      return;
    }
    if (game.teachUrl?.trim()) {
      openHref(game.teachUrl);
      return;
    }
    setModal({ type: "teach", id: game.id });
  }

  function nudgeShelf(dir: -1 | 1) {
    shelfRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  function choose(id: string) {
    if (!editMode) return;
    onSelect?.(id);
  }

  function dismissNext() {
    window.sessionStorage.setItem(NEXT_DISMISS_KEY, "1");
    setNextHidden(true);
  }

  const showNext =
    Boolean(nextEvent) &&
    !nextHidden &&
    splash === "off" &&
    !welcome &&
    !library &&
    modal === null;

  function pickGroup(next: "club" | "classmate") {
    if (next === group) return;
    setSlide(next === "classmate" ? "from-left" : "from-right");
    setGroup(next);
  }

  function openBorrow(id: string) {
    setForm(emptyForm);
    setErrors([]);
    setBorrowOk(false);
    setModal({ type: "borrow", id });
  }

  function drawTopic() {
    if (drawing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pick = () => {
      const pool = content.topics.filter((item) => item !== topic);
      const next = pool[Math.floor(Math.random() * pool.length)] ?? content.topics[0] ?? "";
      setTopic(next);
      setDrawing(false);
    };
    if (reduced) {
      pick();
      return;
    }
    setDrawing(true);
    window.setTimeout(pick, 1000);
  }

  function submitBorrow(event: FormEvent) {
    event.preventDefault();
    const next: string[] = [];
    if (!form.name.trim()) next.push(ui.needName);
    if (!form.sid.trim()) next.push(ui.needId);
    if (!form.phone.trim()) next.push(ui.needPhone);
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.push(ui.badEmail);
    if (!form.start) next.push(ui.needStart);
    if (!form.end) next.push(ui.needEnd);
    if (form.start && form.end && new Date(form.end).getTime() < new Date(form.start).getTime()) next.push(ui.needOrder);
    if (form.start && form.end) {
      const span = new Date(form.end).getTime() - new Date(form.start).getTime();
      if (span >= 0 && span > content.maxBorrowDays * 24 * 60 * 60 * 1000) next.push(ui.tooLong);
    }
    setErrors(next);
    if (!next.length) setBorrowOk(true);
  }

  const nav = [
    [ui.navHome, "#top"],
    [ui.navAbout, "#about"],
    [ui.navGames, "#games"],
    [ui.navNews, "#events"],
    [ui.navJoin, "#join"],
  ] as const;

  const mark = (id: string) => (editMode && selected === id ? "rounded-2xl ring-2 ring-orange-500 ring-offset-2" : "");
  function editProps(id: string) {
    if (!editMode) return {};
    return {
      onClick: (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        choose(id);
      },
    };
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${editMode ? "relative" : ""}`}>
      {editMode ? null : <LocalLabLink />}
      {editMode ? null : <DiceCursor />}
      {showNext && nextEvent ? (
        <NextEventDock
          event={nextEvent}
          ui={ui}
          onOpen={() => (editMode ? choose(`event:${nextEvent.id}`) : setModal({ type: "event", id: nextEvent.id }))}
          onDismiss={dismissNext}
        />
      ) : null}
      {splash !== "off" ? <Splash name={content.name} leaving={splash === "out"} /> : null}
      {welcome ? (
        <Welcome
          content={content}
          onClose={dismissWelcome}
          onJump={(id) => {
            dismissWelcome();
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      ) : null}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-h-11 items-center gap-2">
            <Mark className="h-9 w-9 rounded-xl" />
            <span className="leading-tight">
              <span className="block text-sm font-black">{content.name}</span>
              <span className="hidden text-xs font-normal text-orange-500 sm:block">{content.enName}</span>
            </span>
          </a>
          <RoundIcon href={content.links.instagram.href} label={content.links.instagram.text || "Instagram"}>
            <InstagramIcon />
          </RoundIcon>
          <RoundIcon href={content.links.whatsapp.href} label={content.links.whatsapp.text || "WhatsApp"}>
            <WhatsappIcon />
          </RoundIcon>
          <nav className="ml-auto hidden items-center gap-5 lg:flex">
            {nav.map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-bold text-slate-700">
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-4">
            <div className="hidden items-center gap-1 md:flex">
              {LANGS.map((item) => (
                <Link
                  key={item.id}
                  href={withLang(pathname, item.id)}
                  className={`inline-flex min-h-11 items-center px-1 text-sm font-bold ${item.id === lang ? "text-orange-500" : "text-slate-400"}`}
                  aria-current={item.id === lang ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <button type="button" onClick={goSignup} className="hidden min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-bold text-white sm:inline-flex">
              {ui.signup}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 font-bold lg:hidden"
              aria-expanded={menu}
              aria-label={ui.menu}
              onClick={() => setMenu((open) => !open)}
            >
              <span aria-hidden>{menu ? "×" : "☰"}</span>
            </button>
          </div>
        </div>
        {menu ? (
          <div className="menu-drop border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            {nav.map(([label, href]) => (
              <a key={href} href={href} className="flex min-h-11 items-center font-bold" onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
            <button type="button" onClick={goSignup} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
              {ui.signup}
            </button>
            <div className="mt-2 flex gap-3 md:hidden">
              {LANGS.map((item) => (
                <Link key={item.id} href={withLang(pathname, item.id)} className="inline-flex min-h-11 items-center font-bold">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section id="top" className="relative flex min-h-[65vh] items-center overflow-hidden md:min-h-[85vh]">
          <HeroDots />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className={`text-4xl leading-tight font-black tracking-tight text-slate-900 sm:text-5xl lg:text-7xl ${mark("hero")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("hero")}>
              <span className="wipe block">{content.hero.line1}</span>
              <span className="wipe wipe-2 mt-2 block">
                {content.hero.line2Before}
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">{content.hero.line2Mark}</span>
                {content.hero.line2After}
              </span>
            </h1>
            <p className="rise-late mt-6 text-sm font-medium text-slate-500">
              {content.hero.school} <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800">{ui.replace}</span>
            </p>
            <p className="rise-late mt-2 text-lg font-black">{content.name}</p>
            <p className="rise-late text-sm font-normal text-orange-500">{content.enName}</p>
            <p className="rise-late mt-2 text-sm text-slate-500">{ui.langLine}</p>
            <p
              className={`rise-late mx-auto mt-5 max-w-2xl text-base font-normal leading-relaxed text-slate-600 ${mark("claim")} ${editMode ? "cursor-pointer" : ""}`}
              onClick={editMode ? () => choose("claim") : undefined}
            >
              {content.hero.intro}
            </p>
            <div className="rise-late mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={goSignup} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 font-bold text-white">
                {ui.signupEvent}
              </button>
              <a href="#about" className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 font-bold text-slate-800">
                {ui.learnMore}
              </a>
            </div>
          </div>
        </section>

        <section id="about" ref={about.ref} className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className={`mx-auto grid max-w-6xl items-center gap-10 rounded-[2.5rem] bg-white p-6 shadow-sm md:grid-cols-2 md:p-12 ${about.shown ? "await-rise inview" : "await-rise"}`}>
            <div>
              <p className={`inline-flex rounded-full bg-purple-100 px-4 py-1.5 text-sm font-bold text-purple-700 ${mark("about-pill")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("about-pill")}>{ui.aboutPill}</p>
              <h2 className={`mt-4 text-3xl font-black tracking-tight md:text-4xl ${mark("about-title")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("about-title")}>{content.about.title}</h2>
              <p className={`mt-5 max-w-prose leading-relaxed text-slate-600 ${mark("about-p1")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("about-p1")}>{content.about.p1}</p>
              <p
                className={`mt-4 max-w-prose leading-relaxed text-slate-600 ${mark("about")} ${editMode ? "cursor-pointer" : ""}`}
                onClick={editMode ? () => choose("about") : undefined}
              >
                {content.about.p2}
              </p>
            </div>
            <div className="tilt-group relative mx-auto min-h-80 w-full max-w-sm">
              <div className="pad-tilt absolute inset-x-4 top-4 bottom-0 rounded-[2rem] bg-orange-500" />
              <div
                data-photo=""
                className={`photo-tilt relative flex min-h-80 items-end overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-50 to-slate-200 shadow-lg ${mark("about-photo")} ${editMode ? "cursor-pointer" : ""}`}
                {...editProps("about-photo")}
              >
                {content.about.photoUrl ? (
                  <img src={content.about.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <>
                    <span className="absolute top-16 left-8 h-24 w-16 rotate-6 rounded-lg bg-orange-500 shadow" />
                    <span className="absolute top-24 left-20 h-24 w-16 -rotate-3 rounded-lg bg-indigo-600 shadow" />
                    <span className="absolute top-14 left-32 h-24 w-16 rotate-2 rounded-lg bg-emerald-500 shadow" />
                  </>
                )}
                <p className="relative m-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{ui.photo}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="games" ref={games.ref} className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-12 text-white md:px-12 md:py-16">
            <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-6 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex flex-col items-center gap-4 md:block">
                <p className={`inline-flex rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-bold text-orange-300 ${mark("games-copy")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("games-copy")}>{ui.gamesPill}</p>
                <button type="button" onClick={() => setLibrary(true)} className="min-h-11 text-sm font-bold text-orange-300 md:absolute md:top-0 md:right-0">
                  {ui.gamesMore}
                </button>
              </div>
              <h2 className={`mt-6 text-center text-3xl font-black tracking-tight md:text-5xl ${mark("games-copy")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("games-copy")}>
                {ui.gamesLead}
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">{ui.gamesMark}</span>
                {ui.gamesTail}
              </h2>
              <p className={`mx-auto mt-4 max-w-2xl text-center text-slate-300 ${mark("games-copy")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("games-copy")}>{ui.gamesSub}</p>
              <p className={`mx-auto mt-2 max-w-2xl text-center text-sm text-slate-400 ${mark("games-copy")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("games-copy")}>{ui.gamesNote}</p>
              <div className="mt-8 flex items-center justify-end gap-2">
                <button type="button" aria-label={ui.shelfPrev} onClick={() => nudgeShelf(-1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-600 bg-slate-800 font-bold text-white">
                  ←
                </button>
                <button type="button" aria-label={ui.shelfNext} onClick={() => nudgeShelf(1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-600 bg-slate-800 font-bold text-white">
                  →
                </button>
              </div>
              <div
                ref={shelfRef}
                className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {content.games.map((item, index) => (
                  <div
                    key={item.id}
                    className={`w-[min(82vw,240px)] shrink-0 snap-start sm:w-[260px] ${editMode ? "cursor-pointer" : ""}`}
                    onClick={editMode ? () => choose(`game:${item.id}`) : undefined}
                  >
                    <GameCard
                      game={item}
                      index={index}
                      shown={games.shown}
                      ui={ui}
                      kindLabel={kindLabel[item.kind]}
                      kindClass={KIND_CLASS[item.kind]}
                      picked={selected === `game:${item.id}`}
                      onPlay={() => (editMode ? choose(`game:${item.id}`) : setModal({ type: "ice" }))}
                      onTeach={() => openTeach(item)}
                      onBorrow={() => (editMode ? choose(`game:${item.id}`) : openBorrow(item.id))}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-slate-500 md:hidden">{ui.shelfHint}</p>
            </div>
          </div>
        </section>

        <section id="events" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`inline-flex rounded-full bg-orange-100 px-4 py-1.5 text-sm font-bold text-orange-600 ${mark("news-copy")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("news-copy")}>{ui.newsPill}</p>
                <h2 className={`mt-4 text-3xl font-black tracking-tight md:text-5xl ${mark("news-copy")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("news-copy")}>{ui.newsTitle}</h2>
              </div>
              <p className={`max-w-xs text-sm text-slate-500 md:text-right ${mark("news-copy")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("news-copy")}>{ui.newsAside}</p>
            </div>
            <div className="mt-8 inline-flex w-full rounded-full bg-white p-1 shadow-sm sm:w-auto">
              {([
                ["club", ui.tabClub],
                ["classmate", ui.tabClass],
              ] as const)
                .filter(([id]) => id === "club" || content.events.some((item) => item.group === "classmate"))
                .map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickGroup(id)}
                  className={`min-h-11 flex-1 rounded-full px-5 text-sm font-bold sm:flex-none ${group === id ? "bg-slate-900 text-white" : "text-slate-500 hover:text-orange-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div key={`${group}-${slide}`} className={`mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 ${slide === "from-left" ? "tab-from-left" : ""} ${slide === "from-right" ? "tab-from-right" : ""}`}>
              {visibleEvents.map((item) => (
                <div key={item.id} className={editMode ? "cursor-pointer" : undefined} onClick={editMode ? () => choose(`event:${item.id}`) : undefined}>
                  <EventCard
                    event={item}
                    ui={ui}
                    picked={selected === `event:${item.id}`}
                    onOpen={() => (editMode ? choose(`event:${item.id}`) : setModal({ type: "event", id: item.id }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="join" className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-16 text-center text-white">
            <div className="pointer-events-none absolute -left-8 top-0 h-48 w-48 rounded-full bg-orange-500/40 blur-3xl" />
            <div className="pointer-events-none absolute right-0 bottom-0 h-48 w-48 rounded-full bg-purple-500/40 blur-3xl" />
            <div className="relative">
              <h2 className={`text-3xl font-black tracking-tight md:text-5xl ${mark("join")} ${editMode ? "cursor-pointer" : ""}`} {...editProps("join")}>{ui.joinTitle}</h2>
              <p
                className={`mx-auto mt-4 max-w-2xl leading-relaxed text-slate-300 ${mark("join")} ${editMode ? "cursor-pointer" : ""}`}
                onClick={editMode ? () => choose("join") : undefined}
              >
                {content.join}
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ChannelButton link={content.links.email} className="border border-white/30 bg-white/10" />
                <ChannelButton link={content.links.wechat} className="bg-emerald-600" />
                <ChannelButton link={content.links.whatsapp} className="bg-green-500" />
                <ChannelButton link={content.links.instagram} className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />
                <ChannelButton link={content.links.form} className="bg-indigo-600" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-12 text-center text-slate-300">
        <p className="text-lg font-black text-white">{content.name}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm font-bold">
          <a href="#about" className="inline-flex min-h-11 items-center">{ui.navAbout}</a>
          <a href="#games" className="inline-flex min-h-11 items-center">{ui.navGames}</a>
          <a href="#join" className="inline-flex min-h-11 items-center">{ui.navJoin}</a>
        </div>
        <p className="mt-6 text-sm text-slate-500">{content.footer}</p>
      </footer>

      {library ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setLibrary(false)} className="inline-flex min-h-11 items-center font-bold text-orange-300">
                {ui.libraryBack}
              </button>
              {editMode && onLibraryAdd ? (
                <button
                  type="button"
                  onClick={() => {
                    onLibraryAdd();
                    setLibrary(false);
                  }}
                  className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-4 text-sm font-bold text-white"
                >
                  加一盒
                </button>
              ) : null}
            </div>
            <h2
              className={`mt-4 text-3xl font-black md:text-5xl ${mark("games-copy")} ${editMode ? "cursor-pointer" : ""}`}
              {...editProps("games-copy")}
            >
              {ui.libraryTitle}
            </h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ui.search}
              aria-label={ui.search}
              className="mt-6 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-white placeholder:text-slate-500"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {(["all", "party", "strategy", "deduce", "other"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={kind === item}
                  onClick={() => setKind(item)}
                  className={`min-h-11 rounded-full px-4 text-sm font-bold ${kind === item ? "bg-orange-500 text-white" : "border border-slate-600 text-slate-300"}`}
                >
                  {item === "all" ? ui.filterAll : kindLabel[item]}
                </button>
              ))}
            </div>
            {filtered.length ? (
              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
                {filtered.map((item, index) => (
                  <div
                    key={item.id}
                    className={editMode ? "cursor-pointer" : undefined}
                    onClick={
                      editMode
                        ? () => {
                            choose(`game:${item.id}`);
                            setLibrary(false);
                          }
                        : undefined
                    }
                  >
                    <GameCard
                      game={item}
                      index={index}
                      shown
                      ui={ui}
                      kindLabel={kindLabel[item.kind]}
                      kindClass={KIND_CLASS[item.kind]}
                      picked={selected === `game:${item.id}`}
                      onPlay={() => (editMode ? choose(`game:${item.id}`) : setModal({ type: "ice" }))}
                      onTeach={() => openTeach(item)}
                      onBorrow={() => (editMode ? choose(`game:${item.id}`) : openBorrow(item.id))}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-slate-300">{ui.empty}</p>
            )}
          </div>
        </div>
      ) : null}

      {modal ? (
        <div className="modal-shade fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 p-4" onClick={() => setModal(null)}>
          <div className="flex min-h-full items-center justify-center">
            {modal.type === "ice" ? (
              <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-card w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-6 text-white">
                  <button type="button" aria-label={ui.close} onClick={() => setModal(null)} className="absolute top-3 right-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl font-bold">
                    ×
                  </button>
                  <h2 id={titleId} className="text-2xl font-black">{ui.iceTitle}</h2>
                  <p className="mt-1 text-sm">{ui.iceLead}</p>
                </div>
                <div className="p-6">
                  <div className="flex min-h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 px-4 text-center text-lg font-bold text-slate-800">
                    {topic}
                  </div>
                  <button type="button" disabled={drawing} onClick={drawTopic} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 font-bold text-white disabled:opacity-70">
                    {drawing ? ui.iceDrawing : topic ? ui.iceAgain : ui.iceDraw}
                  </button>
                </div>
              </div>
            ) : null}
            {modal.type === "teach" && activeGame ? (
              <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-card w-full max-w-lg rounded-[2rem] bg-white p-6 text-center shadow-xl" onClick={(event) => event.stopPropagation()}>
                <button type="button" aria-label={ui.close} onClick={() => setModal(null)} className="float-right inline-flex min-h-11 min-w-11 items-center justify-center text-xl font-bold">
                  ×
                </button>
                <p className="mt-2 text-6xl" aria-hidden>{activeGame.emoji}</p>
                <h2 id={titleId} className="mt-3 text-2xl font-black">{activeGame.name}</h2>
                <p className="mt-4 text-slate-600">{ui.teachSoon}</p>
              </div>
            ) : null}
            {modal.type === "borrow" && activeGame ? (
              <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-card max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <button type="button" aria-label={ui.close} onClick={() => setModal(null)} className="float-right inline-flex min-h-11 min-w-11 items-center justify-center text-xl font-bold">
                  ×
                </button>
                <h2 id={titleId} className="text-2xl font-black">{activeGame.name}</h2>
                {borrowOk ? (
                  <div className="mt-6 text-center">
                    <p className="text-lg font-bold">{ui.borrowSaved}</p>
                    <p className="mt-2 text-sm text-slate-500">{ui.borrowLocal}</p>
                    <button type="button" onClick={() => setModal(null)} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                      {ui.close}
                    </button>
                  </div>
                ) : (
                  <form noValidate onSubmit={submitBorrow} className="mt-4 space-y-3 text-left">
                    <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-slate-700">{content.borrowRules}</p>
                    <p className="rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700">{ui.borrowClear}</p>
                    <Field label={ui.borrowName} required>
                      <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} autoComplete="name" />
                    </Field>
                    <Field label={ui.borrowId} required>
                      <input value={form.sid} onChange={(event) => setForm({ ...form, sid: event.target.value })} className={fieldClass} />
                    </Field>
                    <Field label={ui.borrowPhone} required>
                      <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={fieldClass} type="tel" autoComplete="tel" />
                    </Field>
                    <Field label={ui.borrowEmail} hint={ui.borrowOptional}>
                      <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} type="email" autoComplete="email" />
                    </Field>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field label={ui.borrowStart} required>
                        <input value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} className={fieldClass} type="datetime-local" />
                      </Field>
                      <Field label={ui.borrowEnd} required>
                        <input value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} className={fieldClass} type="datetime-local" />
                      </Field>
                    </div>
                    <Field label={ui.borrowNote}>
                      <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className={`${fieldClass} min-h-24 py-2`} />
                    </Field>
                    {errors.length ? (
                      <ul className="text-sm font-bold text-red-600">
                        {errors.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-orange-600 font-bold text-white">
                      {ui.borrowSubmit}
                    </button>
                  </form>
                )}
              </div>
            ) : null}
            {modal.type === "event" && activeEvent ? (
              <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-card max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className={`relative h-56 bg-gradient-to-br ${activeEvent.tint} ${eventEnded(activeEvent) ? "opacity-70" : ""}`}>
                  <button type="button" aria-label={ui.close} onClick={() => setModal(null)} className="absolute top-3 right-3 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/80 text-xl font-bold">
                    ×
                  </button>
                  {activeEvent.coverUrl ? (
                    <img src={activeEvent.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-6xl" aria-hidden>{activeEvent.emoji}</span>
                  )}
                  {eventEnded(activeEvent) ? (
                    <div className="absolute inset-x-0 bottom-0 bg-stone-900/75 px-3 py-2 text-center text-sm font-bold text-white">{ui.endedBar}</div>
                  ) : null}
                </div>
                <div className={`p-6 ${eventEnded(activeEvent) ? "opacity-90" : ""}`}>
                  <h2 id={titleId} className="text-2xl font-black">{activeEvent.title}</h2>
                  <p className="mt-3 text-sm text-slate-600"><span className="font-bold text-slate-900">{ui.time}</span> {activeEvent.time}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-bold text-slate-900">{ui.fee}</span> {activeEvent.fee}
                    {activeEvent.feePlaceholder ? <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800">{ui.replace}</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-slate-600"><span className="font-bold text-slate-900">{ui.place}</span> {activeEvent.place}</p>
                  <Sessions event={activeEvent} ui={ui} ended={eventEnded(activeEvent)} />
                  <p className="mt-5 whitespace-pre-line leading-relaxed text-slate-700">{activeEvent.body}</p>
                  {eventEnded(activeEvent) ? null : (
                    <button type="button" onClick={goSignup} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                      {ui.signup}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const fieldClass = "min-h-11 w-full rounded-xl border border-slate-300 px-3";

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-slate-800">
      {label}
      {required ? <span className="text-orange-600"> *</span> : null}
      {hint ? <span className="ml-2 font-normal text-slate-400">{hint}</span> : null}
      <span className="mt-1 block font-normal">{children}</span>
    </label>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <span className={`grid grid-cols-3 place-items-center gap-0.5 bg-slate-900 p-1.5 ${className ?? ""}`} aria-hidden>
      {HEX.map((color) => (
        <span key={color} className="h-2 w-2" style={{ background: color, clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }} />
      ))}
    </span>
  );
}

function Splash({ name, leaving }: { name: string; leaving: boolean }) {
  return (
    <div className={`splash-root fixed inset-0 z-[80] grid place-items-center bg-slate-50 ${leaving ? "splash-out" : ""}`} aria-hidden>
      <span className="absolute top-[18%] left-[16%] h-2 w-2 rounded-full bg-orange-400/50" />
      <span className="absolute top-[24%] right-[18%] h-3 w-3 rounded-full bg-sky-400/40" />
      <span className="absolute bottom-[22%] left-[22%] h-2.5 w-2.5 rounded-full bg-emerald-400/40" />
      <span className="absolute right-[24%] bottom-[28%] h-2 w-2 rounded-full bg-fuchsia-400/40" />
      <span className="absolute top-[40%] left-[10%] h-1.5 w-1.5 rounded-full bg-violet-400/40" />
      <div className="text-center">
        <div className="mx-auto grid h-52 w-52 place-items-center rounded-[2rem] bg-slate-900 shadow-xl">
          <span className="grid grid-cols-3 gap-2">
            {HEX.map((color) => (
              <span key={color} className="h-9 w-9" style={{ background: color, clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)" }} />
            ))}
          </span>
        </div>
        <p className="mt-6 text-2xl font-black text-slate-900">{name}</p>
      </div>
    </div>
  );
}

function Welcome({ content, onClose, onJump }: { content: ClubContent; onClose: () => void; onJump: (id: string) => void }) {
  const ui = content.ui;
  return (
    <div className="modal-shade fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="modal-card relative w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-xl sm:p-8" onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label={ui.welcomeClose} onClick={onClose} className="absolute top-3 right-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl font-bold text-slate-700">
          ×
        </button>
        <h2 id="welcome-title" className="pr-10 text-2xl font-black">{ui.welcomeTitle}</h2>
        <p className="mt-3 leading-relaxed text-slate-600">{content.welcome}</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ChannelButton link={content.links.whatsapp} className="bg-green-500" />
          <ChannelButton link={content.links.instagram} className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />
          <button type="button" onClick={() => onJump("about")} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-300 font-bold">
            {ui.navAbout}
          </button>
          <button type="button" onClick={() => onJump("games")} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-300 font-bold">
            {ui.navGames}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoundIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const className = "inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200";
  if (!href.trim()) {
    return (
      <span aria-label={label} className={className}>
        {children}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={className}>
      {children}
    </a>
  );
}

function ChannelButton({ link, className }: { link: { text: string; href: string }; className: string }) {
  if (!link.text.trim()) return null;
  const box = `inline-flex min-h-11 items-center justify-center rounded-xl px-6 font-bold text-white ${className}`;
  if (!link.href.trim()) return <span className={box}>{link.text}</span>;
  return (
    <a href={link.href} target="_blank" rel="noreferrer" className={box}>
      {link.text}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 4a8 8 0 0 0-6.9 12l-1 3.6 3.7-1A8 8 0 1 0 12 4Zm4.3 11.3c-.2.5-1 .9-1.4 1-.4 0-.8.2-2.7-.6-2.3-.9-3.7-3.2-3.8-3.4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5l-.3.4c-.1.2-.3.3-.1.6.2.3.7 1.1 1.4 1.8.9.8 1.7 1.1 2 .1.2-.2.4-.4.6-.3.3.1 1.6.8 1.9.9.3.2.4.2.5.3.1.2 0 .8-.2 1.1Z" />
    </svg>
  );
}

function NextEventDock({
  event,
  ui,
  onOpen,
  onDismiss,
}: {
  event: ClubEvent;
  ui: ClubContent["ui"];
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remain = useMemo(() => {
    const ms = Math.max(0, new Date(event.startsAt!).getTime() - now);
    const total = Math.floor(ms / 1000);
    return {
      d: Math.floor(total / 86400),
      h: Math.floor((total % 86400) / 3600),
      m: Math.floor((total % 3600) / 60),
      s: total % 60,
    };
  }, [event.startsAt, now]);

  return (
    <aside className="fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[55] w-[12.5rem] rounded-2xl bg-slate-900 p-2.5 text-white shadow-2xl ring-2 ring-orange-400/50 sm:right-4 sm:bottom-4 sm:w-[min(100%-2rem,19rem)] sm:rounded-[1.5rem] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold tracking-wide text-orange-300 sm:text-xs">{ui.nextLabel}</p>
        <button type="button" onClick={onDismiss} className="text-[10px] font-bold text-slate-400 hover:text-white sm:text-xs">
          {ui.nextDismiss}
        </button>
      </div>
      <h3 className="mt-0.5 text-sm font-black leading-snug sm:mt-1 sm:text-lg">{event.title}</h3>
      <p className="mt-0.5 text-[11px] leading-tight text-slate-300 sm:mt-1 sm:text-sm">{event.time}</p>
      <div className="mt-2 grid grid-cols-4 gap-1 text-center sm:mt-3">
        {[
          [remain.d, ui.nextDay],
          [remain.h, ui.nextHour],
          [remain.m, ui.nextMin],
          [remain.s, ui.nextSec],
        ].map(([value, unit]) => (
          <div key={String(unit)} className="rounded-lg bg-white/10 py-1 sm:rounded-xl sm:py-2">
            <p className="text-sm font-black tabular-nums sm:text-lg">{value}</p>
            <p className="text-[9px] text-slate-400 sm:text-[10px]">{unit}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={onOpen} className="mt-2 inline-flex min-h-8 w-full items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold sm:mt-3 sm:min-h-11 sm:rounded-xl sm:text-sm">
        {ui.nextOpen}
      </button>
    </aside>
  );
}

function GameCard({
  game,
  index,
  shown,
  ui,
  kindLabel,
  kindClass,
  picked = false,
  onPlay,
  onTeach,
  onBorrow,
}: {
  game: ClubGame;
  index: number;
  shown: boolean;
  ui: ClubContent["ui"];
  kindLabel: string;
  kindClass: string;
  picked?: boolean;
  onPlay: () => void;
  onTeach: () => void;
  onBorrow: () => void;
}) {
  return (
    <article
      className={`card-lift group h-full overflow-hidden rounded-[2rem] border bg-slate-800 ${picked ? "border-orange-400 ring-2 ring-orange-400" : "border-slate-700"} ${shown ? "await-deal inview" : "await-deal"}`}
      style={{ ["--i" as string]: index }}
    >
      <div className="relative h-44 overflow-hidden bg-slate-900">
        {game.coverUrl ? (
          <img src={game.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="cover-zoom grid h-full place-items-center text-7xl">{game.emoji}</div>
        )}
        <p className="absolute bottom-3 left-4 z-10 text-xl font-black text-white">{game.name}</p>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-100">{game.players}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${kindClass}`}>{kindLabel}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-300">{game.blurb}</p>
        {(game.showPlay ?? game.action === "play") ? (
          <button type="button" onClick={onPlay} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white">
            {ui.play}
          </button>
        ) : null}
        {(game.showTeach ?? game.action !== "play") ? (
          <button type="button" onClick={onTeach} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-700 font-bold text-white">
            {ui.teach}
          </button>
        ) : null}
        {game.borrowable ? (
          <button type="button" onClick={onBorrow} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-orange-600 font-bold text-white">
            {ui.borrow}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function eventEnded(event: ClubEvent) {
  if (event.startsAt) return new Date(event.startsAt).getTime() < Date.now();
  return event.summary.startsWith("已结束") || event.summary.startsWith("Ended");
}

function EventCard({
  event,
  ui,
  onOpen,
  picked = false,
}: {
  event: ClubEvent;
  ui: ClubContent["ui"];
  onOpen: () => void;
  picked?: boolean;
}) {
  const ended = eventEnded(event);
  return (
    <article className={`overflow-hidden rounded-[2rem] bg-white shadow-sm ${picked ? "ring-2 ring-orange-500" : ""}`}>
      <div className={`relative h-56 bg-gradient-to-br ${event.tint} ${ended ? "opacity-70" : ""}`}>
        {event.coverUrl ? <img src={event.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-6xl" aria-hidden>{event.emoji}</span>}
        <p className="absolute top-4 left-4 z-10 rounded-xl bg-white/80 px-3 py-2 text-sm font-black text-slate-900 backdrop-blur">{event.badge}</p>
        {event.placeholder ? <p className="absolute top-4 right-4 z-10 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{ui.cardReplace}</p> : null}
        {ended ? (
          <div className="absolute inset-x-0 bottom-0 z-10 bg-stone-900/75 px-3 py-2 text-center text-sm font-bold text-white">{ui.endedBar}</div>
        ) : null}
      </div>
      <div className={`p-5 ${ended ? "opacity-80" : ""}`}>
        <h3 className="text-xl font-black transition-colors duration-[240ms] ease-[cubic-bezier(.2,0,0,1)] hover:text-orange-500">{event.title}</h3>
        <p className="mt-2 text-sm font-bold text-orange-600">
          {event.fee}
          {event.feePlaceholder ? <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">{ui.replace}</span> : null}
        </p>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.summary}</p>
        <Sessions event={event} ui={ui} ended={ended} />
        <button
          type="button"
          onClick={onOpen}
          className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl font-bold ${
            ended ? "border border-stone-300 bg-white text-stone-700" : "bg-indigo-600 text-white"
          }`}
        >
          {ended ? ui.openEnded : ui.openEvent}
        </button>
      </div>
    </article>
  );
}

function Sessions({ event, ui, ended = false }: { event: ClubEvent; ui: ClubContent["ui"]; ended?: boolean }) {
  return (
    <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-left">
      <p className="text-sm font-bold text-slate-800">{ui.sessions}</p>
      <ul className="mt-3 space-y-3">
        {event.sessions.map((session) => {
          const ratio = session.capacity > 0 ? Math.min(100, Math.round((session.signed / session.capacity) * 100)) : 0;
          return (
            <li key={session.name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-slate-800">{session.name}</span>
                <span className="text-slate-500">
                  {session.signed} / {session.capacity}
                  {session.placeholder ? ` · ${ui.countNote}` : ""}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${ended ? "bg-stone-400" : "bg-gradient-to-r from-orange-500 to-yellow-500"}`}
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
