export type VisitStore = {
  total: number;
  days: Record<string, number>;
};

export type VisitDay = {
  date: string;
  label: string;
  count: number;
  today: boolean;
};

export type VisitSummary = {
  total: number;
  today: number;
  last7: number;
  days: VisitDay[];
};

const HONG_KONG = "Asia/Hong_Kong";
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const RETAIN_DAYS = 14;

export function emptyVisits(): VisitStore {
  return { total: 0, days: {} };
}

export function hkDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: HONG_KONG,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function recentDayKeys(now: Date, count: number): string[] {
  const [year, month, day] = hkDateKey(now).split("-").map(Number);
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    // Hong Kong is UTC+8 all year. 04:00 UTC is noon there, clear of the date boundary.
    keys.push(hkDateKey(new Date(Date.UTC(year, month - 1, day - offset, 4, 0, 0))));
  }
  return keys;
}

function wholeCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

export function normalizeVisits(input: unknown): VisitStore {
  if (!input || typeof input !== "object") return emptyVisits();
  const raw = input as { total?: unknown; days?: unknown };
  const total = wholeCount(raw.total) ?? 0;
  const days: Record<string, number> = {};
  if (raw.days && typeof raw.days === "object") {
    for (const [key, value] of Object.entries(raw.days)) {
      const count = wholeCount(value);
      if (!DAY_KEY.test(key) || count === null) continue;
      days[key] = count;
    }
  }
  return { total, days };
}

export function recordVisitOn(store: VisitStore, now: Date): VisitStore {
  const today = hkDateKey(now);
  const keep = new Set(recentDayKeys(now, RETAIN_DAYS));
  const days: Record<string, number> = {};
  for (const [key, count] of Object.entries(store.days)) {
    if (keep.has(key)) days[key] = count;
  }
  days[today] = (days[today] ?? 0) + 1;
  return { total: store.total + 1, days };
}

export function summarizeVisits(store: VisitStore, now: Date): VisitSummary {
  const keys = recentDayKeys(now, 7);
  const today = keys[keys.length - 1] ?? hkDateKey(now);
  const days = keys.map((date) => ({
    date,
    label: `${date.slice(5, 7)}/${date.slice(8, 10)}`,
    count: store.days[date] ?? 0,
    today: date === today,
  }));
  return {
    total: store.total,
    today: store.days[today] ?? 0,
    last7: days.reduce((sum, day) => sum + day.count, 0),
    days,
  };
}
