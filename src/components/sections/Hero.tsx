import { motionSettings } from "@/config/motion";
import { cursor, hero, profile, sections, socials } from "@/content/site";
import { Monogram, Seal, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import { InstagramIcon, LinkedInIcon, MailIcon } from "../icons";
import s from "./Hero.module.css";

const socialLinks = [
  { ...socials.email, Icon: MailIcon },
  { ...socials.instagram, Icon: InstagramIcon },
  { ...socials.linkedin, Icon: LinkedInIcon },
];

export function Hero() {
  const { hero: sec } = sections;
  return (
    <header id={sec.id} data-sec={sec.sec} data-screen-label={sec.screen} className={s.hero}>

      <div data-hname="" className={s.name}>
        <div className={s.heyMask}>
          <div data-hhey="" className={cx(type.label, s.hey)}>
            {hero.greeting}
            <br />
            <span className={type.accent}>{hero.greetingAccent}</span>
          </div>
        </div>
        <h1 aria-label={profile.fullName} className={s.title}>
          <span aria-hidden="true" className={s.letters}>
            {[...profile.firstName].map((ch, i) => (
              <span key={i} data-hl="" className={s.letter}>
                {ch}
              </span>
            ))}
          </span>
          <span data-hcopy="" data-r="copy" aria-hidden="true" className={s.copy}>
            ©
          </span>
        </h1>
        <div className={s.lastMask}>
          <div data-hnadh="" aria-hidden="true" className={s.last}>
            {profile.lastName}
          </div>
        </div>
      </div>

      <div data-hfade="" data-r="hmeta" className={cx(type.label, s.meta)}>
        <span className={s.metaStrong}>{profile.role}</span>
        <span data-r="hdash" className={s.dash} />
        <span data-r="hidesm" className={s.metaFocus}>
          {profile.focus}
        </span>
        <span className={s.dash} />
        <span className={s.metaFixed}>
          {profile.city.toUpperCase()}, <span className={type.accent}>{profile.countryCode}</span>
        </span>
      </div>

      <div data-hfade="" className={s.socials}>
        {socialLinks.map(({ href, label, cursor: c, Icon }) => (
          <a key={label} href={href} aria-label={label} data-cursor={c} data-magnet="" className={s.social}>
            <Icon />
          </a>
        ))}
        <span className={s.socialRule} />
      </div>

      {!motionSettings.sealCursor && (
        <div className={s.staticSeal}>
          <div className={s.staticSealRing}>
            <Seal id="vnc-st" label={cursor.staticSeal} fontSize={15} duration={20} spin={motionSettings.spinBadge} />
          </div>
          <Monogram label={profile.monogram} size={56} fontSize={26} filled />
        </div>
      )}
    </header>
  );
}
