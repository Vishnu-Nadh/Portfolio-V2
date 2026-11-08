import type { ReactNode } from "react";
import { motionSettings } from "@/config/motion";
import { HeroFluid } from "./HeroFluid";
import s from "./Background.module.css";

/**
 * Wraps hero + intro. With motionSettings.heroFluid on, the fluid sits behind
 * them (z-index 0) so the swirl carries on below the fold.
 */
export function FluidSpan({ children }: { children: ReactNode }) {
  return (
    <div data-fluidspan="" className={s.span}>
      {motionSettings.heroFluid && (
        <div aria-hidden="true" className={s.spanLayer}>
          <HeroFluid />
        </div>
      )}
      {children}
    </div>
  );
}
