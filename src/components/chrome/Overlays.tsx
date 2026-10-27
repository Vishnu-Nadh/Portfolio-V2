import { motionSettings } from "@/config/motion";
import { cursor, profile, site } from "@/content/site";
import { Mask, Monogram, Seal, type } from "@/design-system/primitives";
import { cx } from "@/lib/cx";
import s from "./Overlays.module.css";

/** Fixed layers the motion engine animates: cut, toast, trails, cursor, preloader. */
export function Overlays() {
  return (
    <>
      <div data-cut="" aria-hidden="true" className={s.cut}>
        <div className={s.cutRow}>
          <Mask pad="display" className={s.cutNameMask}>
            <div data-cut-name="" className={cx(type.display, s.cutName)} />
          </Mask>
          <div data-cut-num="" className={cx(type.label, type.accent)} />
        </div>
      </div>

      <div data-toast="" role="status" aria-live="polite" className={cx(type.label, s.toast)} />

      <canvas data-comet="" aria-hidden="true" className={cx(s.canvas, s.comet)} />

      <div data-vncursor="" className={s.cursor}>
        <div data-cbg="" className={s.cursorBg} />
        <div className={s.cursorRing}>
          <Seal id="vnc-cur" label={cursor.fallback} fontSize={15} duration={14} spin={motionSettings.spinBadge} textProps={{ "data-cursor-text": "" } as object} />
        </div>
        <Monogram data-cdisc="" label={profile.monogram} size={46} fontSize={22} filled className={s.cursorDisc} />
      </div>

      <div data-pre="" className={s.pre}>
        <div className={s.preRow}>
          <div className={cx(type.label, s.preTitle)}>
            {site.preloader.title}
            <br />
            <span className={type.accent}>{site.preloader.subtitle}</span>
          </div>
          <div data-precount="" className={cx(type.display, type.tabular, s.preCount)}>
            000
          </div>
        </div>
        <div className={s.preTrack}>
          <div data-preline="" className={s.preLine} />
        </div>
      </div>
    </>
  );
}
