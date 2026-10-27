"use client";

import { useEffect, useRef } from "react";
import s from "./Background.module.css";

/**
 * Hosts the cursor-reactive fluid behind the hero and intro. It draws nothing itself:
 * the page-wide aurora shows through until the fluid module has loaded,
 * which happens once the page is idle after first paint.
 */
export function HeroFluid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const go = () =>
      import("@/lib/aurora/fluid")
        .then((m) => {
          if (!cancelled && ref.current) dispose = m.mountFluid(ref.current);
        })
        .catch((err) => console.warn("fluid", err));
    const idle = () => {
      if ("requestIdleCallback" in window) idleId = requestIdleCallback(go, { timeout: 2000 });
      else timer = setTimeout(go, 300);
    };
    if (document.readyState === "complete") idle();
    else addEventListener("load", idle, { once: true });

    return () => {
      cancelled = true;
      removeEventListener("load", idle);
      if (idleId !== undefined) cancelIdleCallback(idleId);
      clearTimeout(timer);
      dispose?.();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className={s.fluidHost} />;
}
