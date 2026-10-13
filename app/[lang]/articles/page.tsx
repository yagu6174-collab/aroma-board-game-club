import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import { getChrome } from "@/lib/chrome";
import { readArticles } from "@/lib/content";
import { articlePath, countChars, formatDate } from "@/lib/slug";
import { toTraditional } from "@/lib/traditional";
import { isLang } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getChrome(lang).articles };
}

export default async function ArticlesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [articles, chrome] = await Promise.all([readArticles(), Promise.resolve(getChrome(lang))]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Panel>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{chrome.articles}</h1>
        <ul className="mt-8">
          {articles.articles.map((article) => {
            const title = lang === "zh-Hant" ? toTraditional(article.title) : article.title;
            return (
              <li key={article.slug} className="border-t border-current/15 py-5">
                <Link href={articlePath(lang, article.slug)} className="text-lg font-medium">
                  {title}
                </Link>
                <p className="text-sm text-[#8b93a7]">
                  {formatDate(article.date)} · {countChars(article.body)} {chrome.chars}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>
    </main>
  );
}
