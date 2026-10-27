"use client";

import { footer, nav, profile, sections } from "@/content/site";
import { Monogram, UnderlineLink, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import { useMotion } from "@/lib/motion/MotionProvider";
import { Clock } from "../Clock";
import s from "./Nav.module.css";

/** Every label the section ticker can show, used to reserve its widest width. */
const sectionLabels = [...new Set(Object.values(sections).map((x) => x.sec))];

export function Nav() {
  const { menuOpen, setMenu } = useMotion();
  const fade = cx(s.fades, menuOpen && s.hidden);
  const toggleLabel = menuOpen ? nav.closeLabel : nav.openLabel;

  return (
    <div data-fixed-nav="" data-r="nav" className={s.nav}>
      <Monogram href={`#${sections.hero.id}`} cursor={footer.backToTop.cursor} label={profile.monogram} size={46} fontSize={22} className={s.home} data-r="logo" />

      <nav data-r="navlinks" className={cx(type.label, s.links, fade)}>
        {nav.links.map((l) => (
          <UnderlineLink key={l.href} href={l.href} cursor={l.cursor}>
            {l.label}
          </UnderlineLink>
        ))}
      </nav>

      <div className={s.right}>
        <div data-r="navstat" className={cx(type.label, s.status, fade)}>
          <span className={s.dot}>
            <span data-pulse="" />
            <span />
          </span>
          <span className={s.available}>{profile.availability}</span>
          <span className={s.dash} />
          <span className={type.tabular}>
            {profile.cityCode} <Clock short />
          </span>
        </div>
        <div data-r="navsec" className={cx(s.section, fade)}>
          <div className={cx(type.label, s.ticker)}>
            {sectionLabels.map((l) => (
              <span key={l} aria-hidden="true" className={s.tickerSizer}>
                {l}
              </span>
            ))}
            {/* The engine swaps this label as sections pass. */}
            <div data-navsec="" className={s.tickerText}>
              {sections.hero.sec}
            </div>
          </div>
          <div className={s.progress}>
            <div data-navbar="" className={s.progressBar} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMenu(!menuOpen)}
          data-cursor={toggleLabel}
          data-magnet=""
          aria-label={toggleLabel}
          aria-expanded={menuOpen}
          className={cx(s.burger, menuOpen && s.open)}
        >
          <span className={s.bar} />
          <span className={s.bar} />
        </button>
      </div>
    </div>
  );
}
