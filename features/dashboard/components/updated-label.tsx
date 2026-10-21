"use client";

import { useEffect, useState } from "react";
import { updatedAgo } from "../services/dashboard-format";

/** Relative "Updated …" time that keeps itself current. */
export function UpdatedLabel({ asOf }: { asOf: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="text-sm text-muted-foreground tabular-nums">
      Updated {updatedAgo(asOf, Math.max(now, new Date(asOf).getTime()))}
    </span>
  );
}
