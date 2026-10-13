import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import LogoutButton from "@/components/LogoutButton";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "后台" },
  robots: { index: false, follow: false },
};

const links = [
  ["home", "首页"],
  ["articles", "文章"],
  ["games", "桌游库"],
  ["events", "活动"],
  ["about", "关于"],
  ["contact", "联系"],
] as const;

export default async function AdminHome() {
  if (!(await isAuthed())) return <LoginForm />;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl break-words px-5 py-12">
      <div className="rounded-[2rem] bg-white/90 px-6 py-10 sm:px-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-normal">后台</h1>
        <LogoutButton />
      </div>
      <ul className="mt-10">
        {links.map(([doc, label]) => (
          <li key={doc} className="border-t border-[#e4dcd0] py-4">
            <Link href={`/admin/${doc}`}>{label}</Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm">
        <Link href="/zh">返回站点</Link>
      </p>
      </div>
    </main>
  );
}
