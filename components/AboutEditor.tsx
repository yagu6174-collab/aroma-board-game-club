"use client";

import { useState } from "react";
import type { AboutDoc, RecordItem } from "@/lib/types";
import { buttonClass, fieldClass, quietButtonClass } from "@/components/ui";

const emptyRecord = (): RecordItem => ({ period: "", title: "", detail: "" });

function rows(items: RecordItem[]) {
  return items.length ? items : [emptyRecord()];
}

function RecordFields({
  legend,
  items,
  onChange,
}: {
  legend: string;
  items: RecordItem[];
  onChange: (items: RecordItem[]) => void;
}) {
  return (
    <fieldset className="mt-10">
      <legend className="text-lg">{legend}</legend>
      {items.map((item, index) => (
        <div key={index} className="mt-4 border-t border-[#e4dcd0] pt-4">
          <label className="block text-sm">
            时段
            <input
              value={item.period}
              onChange={(event) => onChange(items.map((row, i) => (i === index ? { ...row, period: event.target.value } : row)))}
              className={fieldClass}
            />
          </label>
          <label className="mt-3 block text-sm">
            标题
            <input
              value={item.title}
              onChange={(event) => onChange(items.map((row, i) => (i === index ? { ...row, title: event.target.value } : row)))}
              className={fieldClass}
            />
          </label>
          <label className="mt-3 block text-sm">
            说明
            <textarea
              rows={3}
              value={item.detail}
              onChange={(event) => onChange(items.map((row, i) => (i === index ? { ...row, detail: event.target.value } : row)))}
              className={fieldClass}
            />
          </label>
          <button type="button" className={`${quietButtonClass} mt-3`} onClick={() => onChange(items.filter((_, i) => i !== index))}>
            去掉这行
          </button>
        </div>
      ))}
      <button type="button" className={`${quietButtonClass} mt-4`} onClick={() => onChange([...items, emptyRecord()])}>
        加一行
      </button>
    </fieldset>
  );
}

export default function AboutEditor({ initial }: { initial: AboutDoc }) {
  const [prose, setProse] = useState(initial.prose);
  const [education, setEducation] = useState(rows(initial.education));
  const [career, setCareer] = useState(rows(initial.career));
  const [skills, setSkills] = useState(initial.skills.length ? initial.skills : [""]);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const res = await fetch("/api/content/about", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prose, education, career, skills }),
    });
    if (!res.ok) {
      setMessage("没有保存。");
      return;
    }
    const doc = (await res.json()) as AboutDoc;
    setProse(doc.prose);
    setEducation(rows(doc.education));
    setCareer(rows(doc.career));
    setSkills(doc.skills.length ? doc.skills : [""]);
    setMessage("已保存。");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label className="block text-sm" htmlFor="prose">
        正文
        <textarea id="prose" rows={6} value={prose} onChange={(event) => setProse(event.target.value)} className={fieldClass} />
      </label>
      <RecordFields legend="教育" items={education} onChange={setEducation} />
      <RecordFields legend="经历" items={career} onChange={setCareer} />
      <fieldset className="mt-10">
        <legend className="text-lg">技能</legend>
        {skills.map((skill, index) => (
          <div key={index} className="mt-4 border-t border-[#e4dcd0] pt-4">
            <input
              value={skill}
              onChange={(event) => setSkills((current) => current.map((item, i) => (i === index ? event.target.value : item)))}
              className={fieldClass}
            />
            <button type="button" className={`${quietButtonClass} mt-3`} onClick={() => setSkills((current) => current.filter((_, i) => i !== index))}>
              去掉这行
            </button>
          </div>
        ))}
        <button type="button" className={`${quietButtonClass} mt-4`} onClick={() => setSkills((current) => [...current, ""])}>
          加一行
        </button>
      </fieldset>
      <button type="submit" className={`${buttonClass} mt-8`}>
        保存
      </button>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
    </form>
  );
}
