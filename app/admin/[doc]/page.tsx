import Link from "next/link";
import { notFound } from "next/navigation";
import AboutEditor from "@/components/AboutEditor";
import ArticlesEditor from "@/components/ArticlesEditor";
import ContactEditor from "@/components/ContactEditor";
import HomeEditor from "@/components/HomeEditor";
import LoginForm from "@/components/LoginForm";
import RecordsEditor from "@/components/RecordsEditor";
import { isAuthed } from "@/lib/auth";
import { readDoc } from "@/lib/content";
import { isDocName, type AboutDoc, type ArticlesDoc, type ContactDoc, type HomeDoc, type RecordsDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

const titles = {
  home: "首页",
  articles: "文章",
  about: "关于",
  contact: "联系",
  games: "桌游库",
  events: "活动",
} as const;

export default async function AdminDocPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isDocName(doc)) notFound();
  if (!(await isAuthed())) return <LoginForm />;
  const initial = await readDoc(doc);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl break-words px-5 py-12">
      <div className="rounded-[2rem] bg-white/90 px-6 py-10 sm:px-10">
      <p className="text-sm">
        <Link href="/admin">后台</Link>
      </p>
      <h1 className="mt-4 text-2xl font-normal">{titles[doc]}</h1>
      <div className="mt-8">
        {doc === "home" ? <HomeEditor initial={initial as HomeDoc} /> : null}
        {doc === "articles" ? <ArticlesEditor initial={initial as ArticlesDoc} /> : null}
        {doc === "about" ? <AboutEditor initial={initial as AboutDoc} /> : null}
        {doc === "contact" ? <ContactEditor initial={initial as ContactDoc} /> : null}
        {doc === "games" || doc === "events" ? <RecordsEditor doc={doc} initial={initial as RecordsDoc} /> : null}
      </div>
      </div>
    </main>
  );
}
