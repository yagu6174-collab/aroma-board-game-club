import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { list, put } from "@vercel/blob";

const DATA = path.join(process.cwd(), ".data");

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "";
}

function fileName(name: string) {
  return `${name}.json`;
}

async function readBlob(name: string, blobToken: string) {
  const result = await list({ prefix: fileName(name), token: blobToken, limit: 20 });
  const blob = result.blobs.find((item) => item.pathname === fileName(name));
  if (!blob) return null;
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as unknown;
}

async function readLocal(name: string) {
  const raw = await readFile(path.join(DATA, fileName(name)), "utf8");
  return JSON.parse(raw) as unknown;
}

export async function readStored(name: string): Promise<unknown | null> {
  const blobToken = token();
  if (blobToken) {
    try {
      const remote = await readBlob(name, blobToken);
      if (remote) return remote;
    } catch {
      // A missing or unreadable blob falls through to the local file.
    }
  }
  try {
    return await readLocal(name);
  } catch {
    return null;
  }
}

const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function writeImage(file: File) {
  const ext = imageTypes[file.type];
  if (!ext) throw new Error("type");
  if (file.size > 4 * 1024 * 1024) throw new Error("size");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const blobToken = token();
  if (blobToken) {
    const blob = await put(`images/${filename}`, bytes, {
      access: "public",
      token: blobToken,
      contentType: file.type,
    });
    return blob.url;
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}

export async function writeStored(name: string, doc: unknown) {
  const body = `${JSON.stringify(doc, null, 2)}\n`;
  const blobToken = token();
  if (blobToken) {
    await put(fileName(name), body, {
      access: "public",
      token: blobToken,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8",
    });
    return;
  }
  await mkdir(DATA, { recursive: true });
  await writeFile(path.join(DATA, fileName(name)), body, "utf8");
}
