import "server-only";

export async function translateZhToEn(text: string) {
  const q = text.trim();
  if (!q) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=zh-CN|en`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("translate failed");
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };
  const out = data.responseData?.translatedText?.trim() ?? "";
  if (!out || /MYMEMORY WARNING/i.test(out) || out === q) {
    throw new Error("translate empty");
  }
  return out;
}
