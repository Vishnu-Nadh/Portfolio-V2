import { contact, footer, profile, sections, site, socials } from "@/content/site";
import { Mask, Monogram, Rule, SectionTag, UnderlineLink, primitives, type, underlineClass } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import { Clock } from "../Clock";
import { ContactNote } from "./ContactNote";
import s from "./Contact.module.css";

export function Contact() {
  const sec = sections.contact;
  return (
    <footer id={sec.id} data-zl="" data-sec={sec.sec} data-screen-label={sec.screen} className={s.contact}>
      <div data-r="g3" className={cx(primitives.grid3, s.head)}>
        <SectionTag data-reveal="" title={sec.title} index={sec.index} className={s.tag} />
        <h2 className={cx(type.display, s.heading)}>
          <Mask as="span" pad="display">
            <span data-rise="" className={s.block}>
              {contact.heading.first}
            </span>
          </Mask>
          <Mask as="span" pad="display">
            <span data-rise="" data-d="120" className={s.outline}>
              {contact.heading.second}
            </span>
          </Mask>
        </h2>
        <div className={s.direct}>
          <p data-reveal="" data-d="200" className={cx(type.body, s.lede)}>
            {contact.lede}
          </p>
          <a href={socials.email.href} data-cursor={socials.email.cursor} data-reveal="" data-d="280" className={s.mail}>
            <span className={cx(type.label, s.mailLabel)}>{contact.directLabel}</span>
            <span className={cx(underlineClass, s.mailAddress)}>{profile.email}</span>
          </a>
        </div>
      </div>

      <ContactNote />

      <div data-r="fbot" className={s.bar}>
        <Rule />
        <Monogram label={profile.monogram} size={40} fontSize={19} data-r="flogo" />
        <div className={s.local}>
          <span className={s.localCity}>{profile.city}</span>
          <span className={type.tabular}>
            <Clock /> {profile.timeZoneLabel}
          </span>
        </div>
        <div className={cx(type.label, s.barLinks)}>
          {footer.links.map((l) => (
            <UnderlineLink key={l.label} href={l.href} cursor={l.cursor}>
              {l.label}
            </UnderlineLink>
          ))}
        </div>
        <UnderlineLink href={`#${sections.hero.id}`} cursor={footer.backToTop.cursor} className={cx(type.label, s.top)}>
          {footer.backToTop.before}
          <span className={type.accent}>{footer.backToTop.accent}</span>
          {footer.backToTop.after}
        </UnderlineLink>
      </div>

      <div aria-hidden="true" className={s.watermarkMask}>
        <div data-mark="" className={s.watermark}>
          {site.watermark}
        </div>
      </div>
    </footer>
  );
}
