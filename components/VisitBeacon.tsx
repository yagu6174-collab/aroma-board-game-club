"use client";

import { useEffect } from "react";

export default function VisitBeacon() {
  useEffect(() => {
    // Dev remounts clear this timer, so one visible homepage load counts once.
    const timer = window.setTimeout(() => {
      void fetch("/api/visits", { method: "POST", keepalive: true }).catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
