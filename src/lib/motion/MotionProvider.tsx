"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { motionSettings } from "@/config/motion";
import { cursor, overview, site } from "@/content/site";
import { MotionEngine } from "./engine";

type MotionContextValue = {
  engine: MotionEngine | null;
  menuOpen: boolean;
  setMenu: (open: boolean) => void;
};

const MotionContext = createContext<MotionContextValue>({ engine: null, menuOpen: false, setMenu: () => {} });

export function MotionProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [engine, setEngine] = useState<MotionEngine | null>(null);

  useEffect(() => {
    const e = new MotionEngine({
      settings: motionSettings,
      orients: overview.orients,
      labels: cursor,
      totalSections: site.totalSections,
      requestMenu: setMenuOpen,
    });
    e.mount();
    // Fallback in case the intro never completes (e.g. animations throttled).
    const pre = setTimeout(() => {
      const p = document.querySelector<HTMLElement>("[data-pre]");
      if (p && !p.dataset.done) p.style.display = "none";
    }, 7000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the engine needs the mounted DOM
    setEngine(e);
    return () => {
      clearTimeout(pre);
      e.destroy();
    };
  }, []);

  useEffect(() => {
    engine?.applyMenu(menuOpen);
  }, [engine, menuOpen]);

  const setMenu = useCallback((open: boolean) => setMenuOpen(open), []);

  return <MotionContext.Provider value={{ engine, menuOpen, setMenu }}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  return useContext(MotionContext);
}
