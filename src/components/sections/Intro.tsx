import { intro, sections } from "@/content/site";
import { Mask, Rule, SectionTag, primitives, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import { RichText } from "../RichText";
import s from "./Intro.module.css";

export function Intro() {
  const sec = sections.intro;
  return (
    <section id={sec.id} data-zl="" data-sec={sec.sec} data-screen-label={sec.screen} className={s.intro}>
      <div data-r="g3" className={cx(primitives.grid3, s.row)}>
        <SectionTag data-reveal="" title={sec.title} index={sec.index} className={s.tag} />
        <div className={s.lead}>
          {intro.lines.map((line, i) => (
            <Mask key={i} pad="line">
              <div data-rise="" data-d={i ? i * 120 : undefined} className={cx(line.muted && s.muted)}>
                <RichText parts={line.text} />
              </div>
            </Mask>
          ))}
        </div>
        <div />
      </div>
      <div data-r="g3" className={cx(primitives.grid3, s.row, s.foot)}>
        <Rule />
        <a href={intro.scroll.href} data-cursor={intro.scroll.cursor} data-reveal="" data-d="200" className={cx(type.label, s.scroll)}>
          <span data-bob="" className={s.arrow}>
            ↓
          </span>
          {intro.scroll.label}
        </a>
        <div />
        <p data-reveal="" data-d="300" className={cx(type.body, s.summary)}>
          {intro.summary}
        </p>
      </div>
    </section>
  );
}
