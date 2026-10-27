import { capabilities, overview, sections } from "@/content/site";
import { Mask, Rule, SectionTag, type } from "@/design-system/primitives";
import { color } from "@/design-system/tokens";
import { cx } from "@/lib/cx";
import { KnotObject } from "../three/KnotObject";
import s from "./Overview.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

export function Overview() {
  const sec = sections.overview;
  return (
    <section id={sec.id} data-sec={sec.sec} data-screen-label={sec.screen} data-r="ov" className={s.overview}>
      <div className={s.stage}>
        <div data-r="knot" className={s.knot}>
          <div aria-hidden="true" className={s.knotGlow} />
          <KnotObject rim={color.accent} />
          {/* The engine rewrites the first text node as blocks scroll past. */}
          <div data-detnum="" className={cx(type.label, s.counter)}>
            {`${pad(1)} `}
            <span className={s.counterTotal}>/ {pad(capabilities.length)}</span>
          </div>
        </div>
      </div>

      <div className={s.content}>
        <div data-r="ovtop" className={s.top}>
          <SectionTag data-reveal="" title={sec.title} index={sec.index} />
        </div>
        <div data-r="ovdet" className={s.details}>
          {capabilities.map((c, k) => (
            <div key={c.name} data-ovx="" data-r="ovx" className={s.block}>
              <Rule color="var(--c-line-soft)" />
              <div className={s.head}>
                <div data-reveal="" className={cx(type.label, type.accent)}>
                  {pad(k + 1)} — {c.title}
                </div>
                <Mask pad="display" className={s.nameMask}>
                  <h3 data-rise="" data-d="80" className={cx(type.display, s.name)}>
                    {c.name.toLowerCase()}
                  </h3>
                </Mask>
              </div>
              <p data-reveal="" data-d="160" className={cx(type.body, s.desc)}>
                {c.description}
              </p>
              <div data-reveal="" data-d="240" className={s.skills}>
                <div className={cx(type.label, s.skillsLabel)}>{overview.skillSetLabel}</div>
                <div className={s.tools}>
                  {c.tools.map((t) => (
                    <div key={t} className={s.tool}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div data-reveal="" className={s.facts}>
            {overview.facts.map((f) => (
              <div key={f.label} className={s.fact}>
                <span className={s.factLabel}>{f.label}</span>
                <span className={s.factValue}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
