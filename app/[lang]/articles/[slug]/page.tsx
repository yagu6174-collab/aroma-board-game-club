import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import { getChrome } from "@/lib/chrome";
import { readArticles } from "@/lib/content";
import { countChars, formatDate, normalizeSlug } from "@/lib/slug";
import { toTraditional } from "@/lib/traditional";
import { isLang } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const articles = await readArticles();
  const article = articles.articles.find((item) => normalizeSlug(item.slug) === normalizeSlug(slug));
  if (!article) return {};
  const title = lang === "zh-Hant" ? toTraditional(article.title) : article.title;
  return { title };
}

export default async function ArticlePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const articles = await readArticles();
  const article = articles.articles.find((item) => normalizeSlug(item.slug) === normalizeSlug(slug));
  if (!article) notFound();
  const chrome = getChrome(lang);
  const title = lang === "zh-Hant" ? toTraditional(article.title) : article.title;
  const body = lang === "zh-Hant" ? toTraditional(article.body) : article.body;

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Panel>
      <article>
        <h1 className="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-[#8b93a7]">
          {formatDate(article.date)} · {countChars(article.body)} {chrome.chars}
        </p>
        <div className="mt-8 whitespace-pre-line">{body}</div>
      </article>
      </Panel>
    </main>
  );
}
