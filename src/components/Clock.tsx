"use client";

import { useClock } from "@/lib/useClock";

/** Live local time. `short` renders HH:MM. */
export function Clock({ short }: { short?: boolean }) {
  const t = useClock();
  return <>{short ? t.slice(0, 5) : t}</>;
}
