export function normalizeSlug(raw: string) {
  let text = raw.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    text = raw.trim();
  }
  return text.normalize("NFC");
}

export function articlePath(lang: string, slug: string) {
  return `/${lang}/articles/${encodeURIComponent(slug.normalize("NFC"))}`;
}

export function countChars(text: string) {
  return [...text.replace(/\s/g, "")].length;
}

export function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso.trim();
  return `${match[1]}.${Number(match[2])}.${Number(match[3])}`;
}
