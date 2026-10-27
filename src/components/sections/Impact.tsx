import { impact, sections } from "@/content/site";
import { Mask, Rule, SectionTag, primitives, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import s from "./Impact.module.css";

export function Impact() {
  const sec = sections.impact;
  return (
    <section id={sec.id} data-zl="" data-sec={sec.sec} data-screen-label={sec.screen} className={s.impact}>
      <div data-r="g3" className={cx(primitives.grid3, s.head)}>
        <SectionTag data-reveal="" title={sec.title} index={sec.index} className={s.tag} />
        <Mask pad="display" className={s.headingMask}>
          <h2 data-rise="" className={cx(type.display, s.heading)}>
            {impact.heading}
          </h2>
        </Mask>
        <p data-reveal="" data-d="200" className={cx(type.body, s.lede)}>
          {impact.lede}
        </p>
      </div>
      <div data-r="stats" className={s.stats}>
        <div />
        {impact.stats.map((st, k) => {
          const delay = k * 120;
          const delay2 = 300 + k * 120;
          return (
            <div key={st.label} className={s.stat}>
              <Mask pad="display" className={s.valueMask}>
                <div data-rise="" data-d={delay} className={cx(type.display, type.tabular, s.value)}>
                  <span data-count={st.value}>{st.value}</span>
                  <span className={type.accent}>+</span>
                </div>
              </Mask>
              <div className={s.caption}>
                <Rule color="var(--c-line-strong)" delay={delay} />
                <div data-reveal="" data-d={delay2} className={cx(type.label, s.label)}>
                  {st.label}
                </div>
                <div data-reveal="" data-d={delay2} className={s.detail}>
                  {st.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
