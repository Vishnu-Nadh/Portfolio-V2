import { experience, sections } from "@/content/site";
import { SectionTag, SplitText, primitives, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import s from "./Experience.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One full-screen panel per role in normal flow; the section tag sits in the
 * first panel. Each panel's lines reveal once as it is reached: number and
 * role letter by letter, then the details in staggered fades.
 */
export function Experience() {
  const sec = sections.work;

  return (
    <>
      {/* Anchor and nav marker; the panels below carry the content. */}
      <section id={sec.id} data-zl="" data-sec={sec.sec} data-screen-label={sec.screen} aria-label="Experience" className={s.work} />

      <div data-zl="" data-screen-label={sec.screen} className={s.list}>
        {experience.jobs.map((j, k) => (
          <article key={j.company} className={s.panel}>
            <div data-r="g3" className={primitives.grid3}>
              <div>{k === 0 && <SectionTag data-reveal="" title={sec.title} index={sec.index} className={s.tag} />}</div>
              <div className={s.main}>
                <div className={s.head}>
                  <div className={s.top}>
                    <div className={cx(s.mask, s.numMask)}>
                      <div data-rise="" data-split="" data-d="0" className={cx(type.display, s.num)}>
                        <SplitText>{pad(k + 1)}</SplitText>
                      </div>
                    </div>
                    <div className={s.meta}>
                      <div data-reveal="" data-d="120" className={cx(type.label, s.company)}>
                        {j.company}
                      </div>
                      <div data-reveal="" data-d="180" className={s.when}>
                        <span className={s.period}>{j.period}</span>
                        <span className={s.length}>{j.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className={cx(s.mask, s.roleMask)}>
                    <h3 data-rise="" data-split="" data-d="80" className={cx(type.display, s.role)}>
                      <SplitText>{j.role.toLowerCase()}</SplitText>
                    </h3>
                  </div>
                </div>

                <div className={s.story}>
                  <p data-reveal="" data-d="260" className={s.short}>
                    {j.short}
                  </p>
                  <div className={s.points}>
                    {j.points.map((pt, i) => (
                      <div key={pt} data-reveal="" data-d={320 + i * 80} className={s.point}>
                        <span className={type.accent}>—</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={s.stack}>
                  {j.stack.map((t, i) => (
                    <span key={t} data-reveal="" data-d={360 + i * 40}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div data-line="" data-r="jobline" className={s.rule} />
          </article>
        ))}
      </div>

      <div data-zl="" className={s.after} />
    </>
  );
}
