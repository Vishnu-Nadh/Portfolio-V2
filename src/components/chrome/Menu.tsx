"use client";

import type { CSSProperties } from "react";
import { nav, profile, socials } from "@/content/site";
import { Mask, SectionTag, UnderlineLink, primitives, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import { useMotion } from "@/lib/motion/MotionProvider";
import { Clock } from "../Clock";
import s from "./Menu.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

export function Menu() {
  const { menuOpen, engine } = useMotion();

  return (
    <div data-menu="" data-r="g3" inert={!menuOpen} className={cx(primitives.grid3, s.menu, menuOpen && s.open)}>
      <SectionTag title={nav.menuTag.title} index={nav.menuTag.index} className={s.tag} />
      <nav className={s.links}>
        {nav.menu.map((m, k) => (
          <a
            key={m.href}
            href={m.href}
            onClick={(e) => {
              e.preventDefault();
              // Section numbers start at 02 — 01 is the index/hero.
              engine?.cutTo(m.href, m.name, pad(k + 2));
            }}
            data-cursor={"GO TO " + m.name.toUpperCase()}
            className={s.link}
            style={{ "--d": menuOpen ? 0.3 + k * 0.07 + "s" : "0s" } as CSSProperties}
          >
            <span className={s.num}>{pad(k + 1)}</span>
            <Mask as="span" pad="display" className={s.nameMask}>
              <span className={cx(type.display, s.name)}>{m.name}</span>
            </Mask>
          </a>
        ))}
      </nav>
      <div className={s.info}>
        <UnderlineLink href={socials.email.href} cursor={socials.email.cursor} className={cx(s.infoLink, s.email)}>
          {profile.email}
        </UnderlineLink>
        <UnderlineLink href={socials.linkedin.href} cursor={socials.linkedin.cursor} className={s.infoLink}>
          {socials.linkedin.label}
        </UnderlineLink>
        <UnderlineLink href={socials.instagram.href} cursor={socials.instagram.cursor} className={s.infoLink}>
          {socials.instagram.label}
        </UnderlineLink>
        <span className={type.tabular}>
          {profile.city} · <Clock /> {profile.timeZoneLabel}
        </span>
      </div>
    </div>
  );
}
