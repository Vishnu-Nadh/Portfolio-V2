import { Fragment } from "react";
import { about, sections } from "@/content/site";
import { SectionTag, primitives, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import s from "./About.module.css";

/** Splits a run into word spans the engine lights up on scroll. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((t, i) =>
        !t ? null : /^\s+$/.test(t) ? (
          <Fragment key={i}>{t}</Fragment>
        ) : (
          <span key={i} data-w="" className={s.word}>
            {t}
          </span>
        ),
      )}
    </>
  );
}

export function About() {
  const sec = sections.about;
  return (
    <section id={sec.id} data-zl="" data-sec={sec.sec} data-screen-label={sec.screen} data-r="g3" className={cx(primitives.grid3, s.about)}>
      <SectionTag data-reveal="" title={sec.title} index={sec.index} className={s.tag} />
      <p data-words="" className={s.body}>
        {about.body.map((part, i) =>
          typeof part === "string" ? (
            <Words key={i} text={part} />
          ) : (
            <span key={i} className={type.accent}>
              <Words text={part.accent} />
            </span>
          ),
        )}
      </p>
      <div className={s.aside}>
        <SectionTag data-reveal="" title={about.exploringTag.title} index={about.exploringTag.index} />
        <div className={s.list}>
          {about.exploring.map((e, k) => (
            <div key={e} data-reveal="" data-d={120 + k * 90} className={s.item}>
              {e}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
