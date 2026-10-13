import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import RecordList from "@/components/RecordList";
import { getChrome } from "@/lib/chrome";
import { readAbout } from "@/lib/content";
import { toTraditional, toTraditionalValue } from "@/lib/traditional";
import { isLang, type RecordItem } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getChrome(lang).about };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [about, chrome] = await Promise.all([readAbout(), Promise.resolve(getChrome(lang))]);
  const prose = lang === "zh-Hant" ? toTraditional(about.prose) : about.prose;
  const education = lang === "zh-Hant" ? toTraditionalValue(about.education) : about.education;
  const career = lang === "zh-Hant" ? toTraditionalValue(about.career) : about.career;
  const skills = lang === "zh-Hant" ? about.skills.map((item) => toTraditional(item)) : about.skills;
  const groups: { label: string; items: RecordItem[] }[] = [
    { label: chrome.education, items: education },
    { label: chrome.career, items: career },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Panel>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{chrome.about}</h1>
      <p className="mt-8 whitespace-pre-line text-[#3d4656]">{prose}</p>
      {groups.map((group) =>
        group.items.length ? (
          <section key={group.label} className="mt-12">
            <h2 className="text-lg font-normal">{group.label}</h2>
            <div className="mt-4">
              <RecordList items={group.items} />
            </div>
          </section>
        ) : null,
      )}
      {skills.length ? (
        <section className="mt-12">
          <h2 className="text-lg font-normal">{chrome.skills}</h2>
          <div className="mt-4">
            {skills.map((skill, index) => (
              <p key={`${skill}-${index}`} className="border-t border-[#e4dcd0] py-4 whitespace-pre-line">
                {skill}
              </p>
            ))}
          </div>
        </section>
      ) : null}
      </Panel>
    </main>
  );
}
