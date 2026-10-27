"use client";

import { useState } from "react";
import { experience, sections } from "@/content/site";
import { Mask, Rule, SectionTag, primitives, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import s from "./Experience.module.css";

export function Experience() {
  const sec = sections.work;
  // Roles expand independently; the most recent starts open.
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  return (
    <section id={sec.id} data-sec={sec.sec} data-screen-label={sec.screen} className={s.work}>
      <div data-r="g3" className={cx(primitives.grid3, s.head)}>
        <SectionTag data-reveal="" title={sec.title} index={sec.index} className={s.tag} />
        <Mask pad="display" className={s.headingMask}>
          <h2 data-rise="" className={cx(type.display, s.heading)}>
            {experience.heading}
          </h2>
        </Mask>
        <p data-reveal="" data-d="200" className={cx(type.body, s.lede)}>
          {experience.lede}
        </p>
      </div>

      <div className={s.list}>
        {experience.jobs.map((j, k) => {
          const isOpen = !!open[k];
          const toggle = () => setOpen((o) => ({ ...o, [k]: !o[k] }));
          const detailId = `job-${k}`;
          return (
            <div key={j.company} className={cx(s.job, isOpen && s.open)}>
              <Rule />
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={detailId}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                  }
                }}
                data-cursor={isOpen ? experience.collapseCursor : experience.expandCursor}
                data-reveal=""
                data-r="jobrow"
                className={s.row}
              >
                <div className={s.period}>{j.period}</div>
                <div className={s.role}>{j.role.toLowerCase()}</div>
                <div className={cx(type.label, s.company)}>{j.company}</div>
                <div aria-hidden="true" className={s.toggle}>
                  +
                </div>
              </div>
              <div className={s.collapse}>
                <div className={s.collapseInner}>
                  <div id={detailId} data-r="jobdet" className={s.detail} inert={!isOpen}>
                    <div className={s.length}>{j.length}</div>
                    <div className={s.story}>
                      <p className={s.short}>{j.short}</p>
                      <div className={s.points}>
                        {j.points.map((pt) => (
                          <div key={pt} className={s.point}>
                            <span className={type.accent}>—</span>
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={s.stack}>
                      {j.stack.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <Rule absolute={false} />
      </div>
    </section>
  );
}
