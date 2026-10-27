"use client";

import { useSyncExternalStore } from "react";
import { profile } from "@/content/site";

/** One shared 1s ticker for every clock on the page. */
let now = "";
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

const format = () =>
  new Date().toLocaleTimeString("en-GB", { timeZone: profile.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit" });

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = format();
    timer = setInterval(() => {
      now = format();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** HH:MM:SS in the profile's time zone; empty during SSR. */
export function useClock() {
  return useSyncExternalStore(subscribe, () => now, () => "");
}
