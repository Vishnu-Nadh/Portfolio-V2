import { intro, sections } from "@/content/site";
import { Mask, SectionTag, primitives } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import { RichText } from "../RichText";
import s from "./Intro.module.css";

/** Statement, then the summary beside a copper dash. data-seq="intro" plays them as one chain. */
export function Intro() {
  const sec = sections.intro;
  return (
    <section id={sec.id} data-zl="" data-sec={sec.sec} data-screen-label={sec.screen} className={s.intro}>
      <div data-r="g3" className={cx(primitives.grid3, s.row)}>
        <SectionTag data-reveal="" title={sec.title} index={sec.index} className={s.tag} />
        <div className={s.lead}>
          {intro.lines.map((line, i) => (
            <Mask key={i} pad="line">
              <div data-rise="" data-split="" data-seq="intro" className={cx(line.muted && s.muted)}>
                <RichText parts={line.text} split />
              </div>
            </Mask>
          ))}
          <div className={s.summaryRow}>
            <div data-line="" data-seq="intro" aria-hidden="true" className={s.dash} />
            <p data-reveal="" data-seq="intro" className={s.summary}>
              {intro.summary}
            </p>
          </div>
        </div>
        <div />
      </div>
    </section>
  );
}
