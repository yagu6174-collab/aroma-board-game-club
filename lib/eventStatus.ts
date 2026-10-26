/** Past events are marked the same way in copy: the summary starts with 已结束. */
export function finishedEventSummary(summary: string, startsAt?: string, now = Date.now()) {
  const started = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  if (!Number.isFinite(started) || started >= now) return summary;
  if (summary.startsWith("尚未举行")) return `已结束${summary.slice("尚未举行".length)}`;
  return summary;
}
