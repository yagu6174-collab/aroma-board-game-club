// Auth for the hourly enrollment cron. Vercel calls GET with Authorization: Bearer CRON_SECRET.
// The admin session is not consulted, and the Apps Script hook secret is not accepted here.
import { createHash, timingSafeEqual } from "crypto";

export const FORM_CRON_PATH = "/api/google/cron";
export const FORM_CRON_SCHEDULE = "0 * * * *";

const MAX_SECRET = 256;

export type FormCronEnv = {
  CRON_SECRET?: string;
};

export type FormCronSyncOptions = { reportEmpty: false };

type HeaderSource = { get(name: string): string | null };

function bearerToken(authorization: string | null) {
  if (!authorization) return "";
  const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization.trim());
  return match?.[1] ?? "";
}

function secretEquals(left: string, right: string) {
  if (!left || !right || left.length > MAX_SECRET || right.length > MAX_SECRET) return false;
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function formCronAuthorized(authorization: string | null, env: FormCronEnv) {
  return secretEquals(bearerToken(authorization), env.CRON_SECRET?.trim() ?? "");
}

export async function runFormCron<T>(
  request: { url?: string; headers: HeaderSource },
  env: FormCronEnv,
  sync: (options: FormCronSyncOptions) => Promise<T>,
) {
  if (!formCronAuthorized(request.headers.get("authorization"), env)) {
    return { status: 401 as const, body: { error: "unauthorized" as const } };
  }
  try {
    return { status: 200 as const, body: await sync({ reportEmpty: false }) };
  } catch {
    return {
      status: 500 as const,
      body: {
        connected: false,
        updates: [] as [],
        messages: [{ text: "同步没有完成，报名人数保持原数字。", warn: true }],
      },
    };
  }
}
