"use client";

import { useState } from "react";
import type { Article, ArticlesDoc } from "@/lib/types";
import { buttonClass, fieldClass, quietButtonClass } from "@/components/ui";

const empty = (): Article => ({ slug: "", title: "", date: "", body: "" });

export default function ArticlesEditor({ initial }: { initial: ArticlesDoc }) {
  const [articles, setArticles] = useState<Article[]>(initial.articles.length ? initial.articles : [empty()]);
  const [message, setMessage] = useState("");

  function update(index: number, patch: Partial<Article>) {
    setArticles((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function save() {
    setMessage("");
    const res = await fetch("/api/content/articles", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articles, retiredSlugs: initial.retiredSlugs }),
    });
    if (!res.ok) {
      setMessage("没有保存。");
      return;
    }
    const doc = (await res.json()) as ArticlesDoc;
    setArticles(doc.articles.length ? doc.articles : [empty()]);
    setMessage("已保存。");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-8"
    >
      {articles.map((article, index) => (
        <fieldset key={`${article.slug}-${index}`} className="border-t border-[#e4dcd0] pt-6">
          <label className="block text-sm">
            标题
            <input value={article.title} onChange={(event) => update(index, { title: event.target.value })} className={fieldClass} />
          </label>
          <label className="mt-4 block text-sm">
            日期
            <input type="date" value={article.date} onChange={(event) => update(index, { date: event.target.value })} className={fieldClass} />
          </label>
          <label className="mt-4 block text-sm">
            正文
            <textarea rows={8} value={article.body} onChange={(event) => update(index, { body: event.target.value })} className={fieldClass} />
          </label>
          <button type="button" className={`${quietButtonClass} mt-3`} onClick={() => setArticles((current) => current.filter((_, i) => i !== index))}>
            去掉这篇
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-4">
        <button type="button" className={quietButtonClass} onClick={() => setArticles((current) => [...current, empty()])}>
          加一篇
        </button>
        <button type="submit" className={buttonClass}>
          保存
        </button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
