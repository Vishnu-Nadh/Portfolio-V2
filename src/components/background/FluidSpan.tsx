import type { ReactNode } from "react";
import { HeroFluid } from "./HeroFluid";
import s from "./Background.module.css";

/**
 * Wraps the sections the hero fluid spans (hero + intro). The fluid sits
 * behind them (z-index 0) so the swirl carries on below the fold.
 */
export function FluidSpan({ children }: { children: ReactNode }) {
  return (
    <div data-fluidspan="" className={s.span}>
      <div aria-hidden="true" className={s.spanLayer}>
        <HeroFluid />
      </div>
      {children}
    </div>
  );
}
