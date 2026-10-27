"use client";

import { useEffect, useRef } from "react";
import { mountAmbientAurora } from "@/lib/aurora/aurora";
import s from "./Background.module.css";

/** Fixed, page-wide copper aurora behind every section. */
export function AmbientAurora() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => mountAmbientAurora(ref.current!), []);
  return <div ref={ref} aria-hidden="true" className={s.ambient} />;
}
