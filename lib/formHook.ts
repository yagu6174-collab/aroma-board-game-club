// Auth for the form-submit webhook. The admin session is not consulted.
import { createHash, timingSafeEqual } from "crypto";

export const FORM_HOOK_PATH = "/api/google/hook";
export const DEFAULT_FORM_HOOK_URL = `https://aroma-board-game-club.vercel.app${FORM_HOOK_PATH}`;
export const FORM_HOOK_HEADER = "x-form-hook-secret";

const MAX_SECRET = 256;
const MAX_BODY = 16_384;

export type FormHookEnv = {
  FORM_HOOK_SECRET?: string;
  CRON_SECRET?: string;
};

export type FormHookCall = {
  authorization: string | null;
  hookHeader: string | null;
  secretField: string | null;
  formId: string | null;
};

export type FormHookSyncOptions = { reportEmpty: true; formId?: string };

type HeaderSource = { get(name: string): string | null };

export function configuredHookSecrets(env: FormHookEnv) {
  const values = [env.FORM_HOOK_SECRET, env.CRON_SECRET].map((item) => item?.trim() ?? "").filter(Boolean);
  return [...new Set(values)];
}

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

export function providedHookSecrets(call: FormHookCall) {
  return [bearerToken(call.authorization), call.hookHeader ?? "", call.secretField ?? ""].map((item) => item.trim()).filter(Boolean);
}

export function formHookAuthorized(call: FormHookCall, env: FormHookEnv) {
  const configured = configuredHookSecrets(env);
  const provided = providedHookSecrets(call);
  if (!configured.length || !provided.length) return false;
  let ok = false;
  for (const secret of provided) {
    for (const expected of configured) {
      if (secretEquals(secret, expected)) ok = true;
    }
  }
  return ok;
}

export function formHookSyncOptions(call: FormHookCall): FormHookSyncOptions {
  const formId = call.formId?.trim().slice(0, 512) ?? "";
  return formId ? { reportEmpty: true, formId } : { reportEmpty: true };
}

export async function readFormHookCall(request: { url: string; headers: HeaderSource; text(): Promise<string> }): Promise<FormHookCall> {
  const url = new URL(request.url);
  let secretField = "";
  let formId = url.searchParams.get("formId")?.trim() ?? "";
  const raw = await request.text();
  if (raw.trim() && raw.length <= MAX_BODY) {
    try {
      const body = JSON.parse(raw) as unknown;
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const record = body as Record<string, unknown>;
        if (typeof record.secret === "string") secretField = record.secret;
        if (typeof record.formId === "string" && record.formId.trim()) formId = record.formId.trim();
      }
    } catch {
      // A non-JSON body never carries the secret. Header auth can still succeed.
    }
  }
  return {
    authorization: request.headers.get("authorization"),
    hookHeader: request.headers.get(FORM_HOOK_HEADER),
    secretField,
    formId,
  };
}

export async function runFormHook<T>(
  call: FormHookCall,
  env: FormHookEnv,
  sync: (options: FormHookSyncOptions) => Promise<T>,
) {
  if (!formHookAuthorized(call, env)) return { status: 401 as const, body: { error: "unauthorized" as const } };
  try {
    return { status: 200 as const, body: await sync(formHookSyncOptions(call)) };
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
