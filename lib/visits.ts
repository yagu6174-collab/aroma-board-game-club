import "server-only";
import { readStored, writeStored } from "@/lib/store";
import { emptyVisits, normalizeVisits, recordVisitOn, summarizeVisits, type VisitSummary } from "@/lib/visitMath";

const KEY = "visits";

// One JSON document, same store as the site draft. The queue keeps a single
// server process from dropping overlapping increments. Separate instances can still race.

let chain: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function recordVisit(now = new Date()) {
  await enqueue(async () => {
    const stored = normalizeVisits(await readStored(KEY));
    await writeStored(KEY, recordVisitOn(stored, now));
  });
}

export async function readVisitStats(now = new Date()): Promise<VisitSummary> {
  try {
    return summarizeVisits(normalizeVisits(await readStored(KEY)), now);
  } catch {
    return summarizeVisits(emptyVisits(), now);
  }
}
