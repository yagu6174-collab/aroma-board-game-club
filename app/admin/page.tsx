import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import SiteEditor from "@/components/admin/SiteEditor";
import { isAuthed } from "@/lib/auth";
import { mergeFirstSessionSigned } from "@/lib/formSync";
import { oauthNotice, syncFormCounts } from "@/lib/google";
import { readSiteDraft } from "@/lib/site";
import { readVisitStats } from "@/lib/visits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "后台" },
  robots: { index: false, follow: false },
};

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ google?: string | string[] }> }) {
  if (!(await isAuthed())) return <LoginForm />;
  const query = await searchParams;
  const code = Array.isArray(query.google) ? query.google[0] : query.google;
  const synced = await syncFormCounts({ reportEmpty: false }).catch(() => ({
    connected: false,
    updates: [] as { id: string; signed: number }[],
    messages: [{ text: "暂时没有同步报名人数，页面上的数字保持不变。", warn: true }],
  }));
  const [draft, visits] = await Promise.all([readSiteDraft(), readVisitStats()]);
  const oauth = oauthNotice(code);
  const initial = { ...draft, events: mergeFirstSessionSigned(draft.events, synced.updates) };
  return <SiteEditor initial={initial} visits={visits} googleConnected={synced.connected} googleMessages={oauth ? [oauth, ...synced.messages] : synced.messages} />;
}
