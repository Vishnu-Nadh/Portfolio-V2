import type Lenis from "lenis";
import type { MotionSettings } from "@/config/motion";
import { ease, expoOut, legacyEase } from "@/design-system/tokens";
import { sealText } from "@/design-system/primitives";
import { startReveals } from "./reveal";

/**
 * The page-wide motion layer. It drives everything that runs per frame or
 * reacts to scroll/pointer, and talks to the markup only through data
 * attributes, so sections stay plain React.
 *
 * Scroll reveals and counters live in reveal.ts (IntersectionObserver + CSS
 * transitions). Everything here is either a one-shot Web Animation or a
 * cheap per-frame step that reads cached geometry instead of measuring.
 * With reduced motion nothing is parked or animated.
 *
 * DOM contract
 *  [data-reveal] [data-rise] [data-line]  scroll reveals (optional [data-d] delay ms)
 *  [data-count]                           count-up numerals
 *  [data-w]                               scroll-lit words inside [data-words]
 *  [data-sec]                             section label shown by [data-navsec]
 *  [data-screen-label]                    cursor zone label lookup
 *  [data-cursor="LABEL"]                  cursor label override
 *  [data-magnet]                          element follows the pointer
 *  [data-ovx]                             capability block (drives knot pose)
 *  [data-hname] [data-hfade] [data-hl] …  hero pieces
 *  [data-pre] [data-cut] [data-toast] [data-comet] [data-vncursor]  overlays
 */

export type KnotHandle = { el: HTMLElement; orient: number[]; lean: number[] };

type Pointer = { x: number; y: number };
type Box = { top: number; h: number };
type ScrollCache = {
  t: number;
  ovx: HTMLElement[];
  secs: HTMLElement[];
  words: HTMLElement[];
  num: HTMLElement | null;
  hname: HTMLElement | null;
  hfade: HTMLElement[];
  navsec: HTMLElement | null;
  navbar: HTMLElement | null;
  para: HTMLElement | null;
  mark: HTMLElement | null;
  foot: HTMLElement | null;
  /** Page-space geometry, measured once per cache so scrolling never forces layout. */
  geo?: { secs: Box[]; ovx: Box[]; para: Box | null; foot: Box | null; max: number };
};

export type EngineOptions = {
  settings: MotionSettings;
  orients: number[][];
  labels: { fallback: string; link: string; menu: string; emailCopied: string; zones: Record<string, string> };
  totalSections: string;
  /** Asks React to open/close the menu. */
  requestMenu: (open: boolean) => void;
};

const qs = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const qsa = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];

export class MotionEngine {
  private o: EngineOptions;
  lenis: Lenis | null = null;
  menuOpen = false;
  knot: KnotHandle | null = null;

  /** The knot registers itself so scroll can drive its pose. Returns an unregister fn. */
  registerKnot(h: KnotHandle) {
    this.knot = h;
    return () => {
      if (this.knot === h) this.knot = null;
    };
  }

  private raf = 0;
  private timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
  private ptr: Pointer | null = null;
  private pMoveT = 0;
  private ptrMoved = false;
  private ptrOut = false;
  private overLink = false;
  private lastHit: Element | null = null;
  private labelHold = 0;
  private wantLabel: string | null = null;
  private mag: HTMLElement | null = null;
  private introLock = false;
  private cutting = false;
  private lastSY: number | undefined;
  private frame = 0;
  private cache: ScrollCache | null = null;
  private curSec: string | undefined;
  private detK: number | undefined;
  private cMode: string | undefined;
  private leanRect: DOMRect | null = null;
  private trail: Pointer[] = [];
  private cometDirty = false;
  private cleanup: (() => void)[] = [];
  /** Web Animations started here, cancelled on teardown so a remount replays cleanly. */
  private anims: Animation[] = [];

  constructor(o: EngineOptions) {
    this.o = o;
  }

  /* ---------------- capability checks ---------------- */
  motionOn() {
    return this.o.settings.reveal && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  private fine() {
    return matchMedia("(pointer:fine)").matches;
  }
  private cursorOn() {
    return this.o.settings.sealCursor && this.fine();
  }
  private animate(el: Element | null, kf: Keyframe[], opts: KeyframeAnimationOptions) {
    if (!el) return null;
    const a = el.animate(kf, opts);
    this.anims.push(a);
    return a;
  }

  /* ---------------- public API ---------------- */
  scrollToY(y: number, d?: number) {
    if (this.lenis) this.lenis.scrollTo(y, { duration: d ?? 1.6 });
    else scrollTo({ top: y, behavior: "smooth" });
  }

  /** Called by React whenever the menu state changes. */
  applyMenu(open: boolean) {
    this.menuOpen = open;
    if (this.lenis) {
      if (open) this.lenis.stop();
      else this.lenis.start();
    }
  }

  /** Full-screen wipe with the section name, then jump. */
  cutTo(href: string, name: string, num: string) {
    const target = qs(href);
    const cut = qs("[data-cut]");
    if (!target || !cut || !this.motionOn() || !cut.animate) {
      this.o.requestMenu(false);
      setTimeout(() => {
        if (target) this.scrollToY(target.getBoundingClientRect().top + scrollY, 1.8);
      }, 420);
      return;
    }
    if (this.cutting) return;
    this.cutting = true;
    const nameEl = cut.querySelector<HTMLElement>("[data-cut-name]")!;
    nameEl.textContent = name;
    cut.querySelector("[data-cut-num]")!.textContent = num + " / " + this.o.totalSections;
    cut.style.display = "flex";
    const inA = cut.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 750, easing: legacyEase.inOut, fill: "forwards" });
    nameEl.animate([{ transform: "translateY(110%)" }, { transform: "none" }], { duration: 900, delay: 280, easing: legacyEase.out, fill: "backwards" });
    inA.onfinish = () => {
      this.o.requestMenu(false);
      const y = target.getBoundingClientRect().top + scrollY;
      if (this.lenis) this.lenis.scrollTo(y, { immediate: true, force: true });
      else scrollTo(0, y);
      this.cache = null;
      setTimeout(() => {
        const outA = cut.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: 850, easing: legacyEase.inOut, fill: "forwards" });
        outA.onfinish = () => {
          cut.style.display = "none";
          inA.cancel();
          outA.cancel();
          this.cutting = false;
        };
      }, 520);
    };
  }

  toast(msg: string) {
    const t = qs("[data-toast]");
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = "1";
    t.style.transform = "translate(-50%,0)";
    clearTimeout(this.timers.toast);
    this.timers.toast = setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translate(-50%,16px)";
    }, 1800);
  }

  copyEmail(addr: string) {
    const done = () => {
      this.labelHold = performance.now() + 1500;
      this.wantLabel = null;
      this.setLabel(this.o.labels.emailCopied);
      this.toast(this.o.labels.emailCopied + " · " + addr.toUpperCase());
    };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = addr;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
      done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done, fallback);
    else fallback();
  }

  /** Animate the "thank you" heading after a sent note. */
  riseSent() {
    requestAnimationFrame(() => {
      const r = qs("[data-sentrise]");
      if (r && this.motionOn()) r.animate([{ transform: "translateY(110%)" }, { transform: "none" }], { duration: 1100, easing: legacyEase.out });
    });
  }

  /* ---------------- lifecycle ---------------- */
  mount() {
    const on = this.motionOn();
    if (on) qsa("[data-w]").forEach((w) => (w.style.opacity = ".16"));
    if (on) this.cleanup.push(startReveals());
    this.runIntro();
    if (on) {
      this.animate(qs("[data-pulse]"), [{ transform: "scale(1)", opacity: 0.7 }, { transform: "scale(3.2)", opacity: 0 }], { duration: 2200, iterations: Infinity, easing: legacyEase.out });
      this.animate(qs("[data-bob]"), [{ transform: "translateY(-3px)" }, { transform: "translateY(5px)" }], { duration: 1400, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
    }

    const c = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, s: 0.5, ts: 0.5, seen: false };
    const cursorEl = () => qs("[data-vncursor]");

    const onMove = (e: PointerEvent) => {
      this.ptrOut = false;
      if (this.ptr) this.pMoveT = performance.now();
      c.tx = e.clientX;
      c.ty = e.clientY;
      this.ptr = { x: e.clientX, y: e.clientY };
      this.ptrMoved = true;
      if (!c.seen) {
        c.x = c.tx;
        c.y = c.ty;
        c.seen = true;
      }
      const t = e.target as Element;
      const closest = (s: string) => (t && t.closest ? t.closest<HTMLElement>(s) : null);
      this.overLink = !!closest("a,button");
      c.ts = closest("a,button,[data-cursor]") ? 0.85 : 0.5;
      const m = closest("[data-magnet]");
      if (this.mag && this.mag !== m) {
        this.mag.style.transform = "";
        this.mag = null;
      }
      if (m && this.motionOn()) {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        m.style.transform = `translate3d(${dx * 0.3}px,${dy * 0.3}px,0)`;
        this.mag = m;
      }
      const el = cursorEl();
      if (el && this.cursorOn()) el.style.opacity = closest("input,textarea") ? "0" : "1";
    };
    const onLeave = () => {
      this.ptrOut = true;
      const el = cursorEl();
      if (el) el.style.opacity = "0";
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.menuOpen) this.o.requestMenu(false);
    };
    const onResize = () => {
      this.cache = null;
    };
    const onClickDoc = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const t = e.target as Element;
      const a = t && t.closest ? t.closest("a[href]") : null;
      if (!a) return;
      const href = a.getAttribute("href")!;
      if (href.startsWith("mailto:")) {
        e.preventDefault();
        this.copyEmail(href.slice(7));
      } else if (this.lenis && href.length > 1 && href.startsWith("#")) {
        // Lenis glides to in-page anchors (its `anchors` option); stop the
        // browser's instant jump so it doesn't cut the glide short.
        e.preventDefault();
      }
    };
    document.addEventListener("click", onClickDoc);
    addEventListener("pointermove", onMove);
    addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
    document.documentElement.addEventListener("pointerleave", onLeave);
    this.cleanup.push(() => {
      document.removeEventListener("click", onClickDoc);
      removeEventListener("pointermove", onMove);
      removeEventListener("keydown", onKey);
      removeEventListener("resize", onResize);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("vn-cursor");
    });

    void import("lenis").then(({ default: LenisCtor }) => {
      if (this.raf === -1) return;
      this.lenis = new LenisCtor({
        lerp: 0.1,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
        smoothWheel: true,
        anchors: { duration: 1.8, easing: expoOut },
      });
      if (this.introLock || this.menuOpen) this.lenis.stop();
    });

    const loop = (time: number) => {
      this.raf = requestAnimationFrame(loop);
      if (this.lenis) this.lenis.raf(time);
      const sy = this.lenis ? this.lenis.scroll : scrollY;
      const moved = sy !== this.lastSY;
      this.lastSY = sy;
      this.frame++;
      if (moved || this.frame % 20 === 0) this.stepScroll(sy);
      if (this.ptr && (this.ptrMoved || (moved && this.frame % 6 === 0))) {
        this.ptrMoved = false;
        const t = document.elementFromPoint(this.ptr.x, this.ptr.y);
        // Content scrolling under a still pointer changes what it is over.
        if (t !== this.lastHit) this.overLink = !!(t && t.closest && t.closest("a,button"));
        if (t !== this.lastHit || (this.labelHold && performance.now() > this.labelHold)) {
          this.lastHit = t;
          if (!this.labelHold || performance.now() > this.labelHold) {
            this.labelHold = 0;
            this.setLabel(this.labelFor(t));
          }
        }
      }
      this.stepLean();
      this.stepCursorParts();
      this.stepComet();
      const el = cursorEl();
      if (!el) return;
      const on = this.cursorOn();
      document.documentElement.classList.toggle("vn-cursor", on);
      if (!on) {
        el.style.opacity = "0";
        return;
      }
      c.x += (c.tx - c.x) * 0.2;
      c.y += (c.ty - c.y) * 0.2;
      c.s += (c.ts - c.s) * 0.15;
      el.style.transform = `translate3d(${c.x - 75}px,${c.y - 75}px,0) scale(${c.s})`;
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    Object.values(this.timers).forEach((t) => clearTimeout(t));
    this.anims.forEach((a) => a.cancel());
    this.anims = [];
    cancelAnimationFrame(this.raf);
    this.raf = -1;
    this.lenis?.destroy();
    this.lenis = null;
    this.cache = null;
    this.cleanup.forEach((f) => f());
    this.cleanup = [];
  }

  /* ---------------- intro ---------------- */
  private runIntro() {
    const pre = qs("[data-pre]");
    if (pre && pre.dataset.done) {
      this.introLock = false;
      return;
    }
    if (!this.motionOn() || !this.o.settings.intro) {
      if (pre) {
        pre.style.display = "none";
        pre.dataset.done = "1";
      }
      return;
    }
    const T0 = 1350;
    const A = (el: Element | null, kf: Keyframe[], o: KeyframeAnimationOptions) => this.animate(el, kf, { fill: "backwards", easing: ease.out, ...o });
    this.introLock = true;
    qsa("[data-hl]").forEach((el, i) => A(el, [{ transform: "translateY(190%)" }, { transform: "none" }], { duration: 1600, delay: T0 + 250 + i * 55 }));
    A(qs("[data-hhey]"), [{ transform: "translateY(125%)" }, { transform: "none" }], { duration: 1300, delay: T0 + 150 });
    A(qs("[data-hnadh]"), [{ transform: "translateY(190%)" }, { transform: "none" }], { duration: 1500, delay: T0 + 700 });
    A(qs("[data-hcopy]"), [{ opacity: 0, transform: "scale(.4) rotate(-120deg)" }, { opacity: 1, transform: "none" }], { duration: 1000, delay: T0 + 900 });
    qsa("[data-hfade]").forEach((el, i) => A(el, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 1000, delay: T0 + 1000 + i * 100 }));
    A(qs("[data-fixed-nav]"), [{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: 1000, delay: T0 + 1100 });

    const cnt = qs("[data-precount]");
    const ln = qs("[data-preline]");
    const t0 = performance.now();
    const step = () => {
      if (this.raf === -1) return;
      const p = Math.min(1, (performance.now() - t0) / 1150);
      const e = 1 - Math.pow(1 - p, 3);
      if (cnt) cnt.textContent = String(Math.round(e * 100)).padStart(3, "0");
      if (ln) ln.style.width = e * 100 + "%";
      if (p < 1) requestAnimationFrame(step);
    };
    step();
    const wipe = this.animate(pre, [{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: 1150, delay: T0, easing: ease.inOutStrong, fill: "forwards" });
    if (wipe && pre)
      wipe.onfinish = () => {
        pre.style.display = "none";
        pre.dataset.done = "1";
      };
    clearTimeout(this.timers.intro);
    this.timers.intro = setTimeout(() => {
      this.introLock = false;
      if (this.lenis && !this.menuOpen) this.lenis.start();
    }, T0 + 900);
  }

  /* ---------------- cursor label ---------------- */
  private labelFor(t: Element | null) {
    const L = this.o.labels;
    if (!t || !t.closest) return L.fallback;
    const d = t.closest<HTMLElement>("[data-cursor]");
    if (d && d.dataset.cursor) return d.dataset.cursor;
    if (t.closest("a,button")) return L.link;
    if (this.menuOpen && t.closest("[data-menu]")) return L.menu;
    const z = t.closest<HTMLElement>("[data-screen-label]");
    return (z && L.zones[z.dataset.screenLabel!]) || L.fallback;
  }

  private setLabel(l: string) {
    if (l === this.wantLabel) return;
    this.wantLabel = l;
    const tx = qs<SVGTextElement>("[data-cursor-text]");
    if (!tx) return;
    tx.style.opacity = "0";
    clearTimeout(this.timers.label);
    this.timers.label = setTimeout(() => {
      const tp = tx.firstChild;
      if (tp) tp.textContent = sealText(this.wantLabel!);
      tx.style.opacity = "1";
    }, 110);
  }

  /* ---------------- per-frame steps ---------------- */
  private stepLean() {
    const obj = this.knot;
    if (!obj) return;
    const blk = this.motionOn() && this.lastHit && this.lastHit.closest ? this.lastHit.closest("[data-ovx]") : null;
    let lx = 0;
    let ly = 0;
    if (blk && this.ptr) {
      if (!this.leanRect || this.frame % 10 === 0) this.leanRect = obj.el.getBoundingClientRect();
      const k = this.leanRect;
      const kx = k.left + k.width / 2;
      const ky = k.top + k.height / 2;
      lx = Math.max(-0.6, Math.min(0.6, ((this.ptr.x - kx) / innerWidth) * 1.4));
      ly = Math.max(-0.4, Math.min(0.4, ((this.ptr.y - ky) / innerHeight) * 0.9));
    }
    obj.lean = [lx, ly];
  }

  /** Soft smoke trail. Drawn at 1x and hidden entirely while idle. */
  private stepComet() {
    const cv = qs<HTMLCanvasElement>("[data-comet]");
    if (!cv) return;
    const on = this.o.settings.cometTail && this.motionOn() && this.fine() && this.ptr && !this.menuOpen && !this.ptrOut;
    const W = innerWidth;
    const H = innerHeight;
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }
    const ctx = cv.getContext("2d")!;
    const T = this.trail;
    const last = T[0];
    const moving = on && this.pMoveT && performance.now() - this.pMoveT < 60 && (!last || Math.hypot(this.ptr!.x - last.x, this.ptr!.y - last.y) > 1);
    if (moving) {
      T.unshift({ x: this.ptr!.x, y: this.ptr!.y });
      if (T.length > 18) T.pop();
    } else if (T.length) {
      T.pop();
      if (T.length) T.pop();
    }
    if (!T.length) {
      if (this.cometDirty) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        this.cometDirty = false;
        cv.style.display = "none";
      }
      return;
    }
    if (cv.style.display !== "block") cv.style.display = "block";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    this.cometDirty = true;
    for (let k = T.length - 1; k >= 0; k--) {
      const p = T[k];
      const t = 1 - k / 18;
      const r = 16 + t * 56;
      const al = 0.012 + t * 0.03;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, "rgba(58,56,54," + al.toFixed(3) + ")");
      g.addColorStop(1, "rgba(58,56,54,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 6.2832);
      ctx.fill();
    }
  }

  private stepCursorParts() {
    const bg = qs("[data-cbg]");
    const dc = qs("[data-cdisc]");
    const hollow = this.overLink;
    const m = hollow ? "1" : "0";
    if (this.cMode === m) return;
    this.cMode = m;
    if (bg) bg.style.background = hollow ? "rgba(17,17,17,0)" : "rgba(17,17,17,.72)";
    if (dc) dc.style.transform = hollow ? "scale(0)" : "none";
  }

  private stepScroll(sy: number) {
    const vh = innerHeight;
    const on = this.motionOn();
    const C =
      this.cache && performance.now() - this.cache.t < 1500
        ? this.cache
        : (this.cache = {
            t: performance.now(),
            ovx: qsa("[data-ovx]"),
            secs: qsa("[data-sec]"),
            words: qsa("[data-w]"),
            num: qs("[data-detnum]"),
            hname: qs("[data-hname]"),
            hfade: qsa("[data-hfade]"),
            navsec: qs("[data-navsec]"),
            navbar: qs("[data-navbar]"),
            para: qs("[data-words]"),
            mark: qs("[data-mark]"),
            foot: document.getElementById("contact"),
          });
    if (!C.geo) {
      const Y = (el: HTMLElement): Box => {
        const r = el.getBoundingClientRect();
        return { top: r.top + sy, h: r.height };
      };
      C.geo = {
        secs: C.secs.map(Y),
        ovx: C.ovx.map(Y),
        para: C.para ? Y(C.para) : null,
        foot: C.foot ? Y(C.foot) : null,
        max: Math.max(1, document.documentElement.scrollHeight - vh),
      };
    }
    const G = C.geo;

    const hp = Math.min(1, Math.max(0, sy / vh));
    if (C.hname && on) {
      C.hname.style.transform = `translate3d(0,${(hp * vh * 0.22).toFixed(1)}px,0) scale(${(1 - hp * 0.05).toFixed(4)})`;
      C.hname.style.opacity = (1 - hp * 0.9).toFixed(3);
    }
    C.hfade.forEach((el) => {
      el.style.opacity = Math.max(0, 1 - sy / (vh * 0.2)).toFixed(3);
    });
    if (C.navbar) C.navbar.style.transform = "scaleX(" + Math.min(1, sy / G.max).toFixed(4) + ")";

    let cur = C.secs[0];
    G.secs.forEach((g, j) => {
      if (g.top - sy < vh * 0.45) cur = C.secs[j];
    });
    if (cur && C.navsec && cur.dataset.sec !== this.curSec) {
      this.curSec = cur.dataset.sec;
      const lbl = this.curSec!;
      const ns = C.navsec;
      if (on && ns.animate) {
        const out = ns.animate([{ transform: "none" }, { transform: "translateY(-100%)" }], { duration: 260, easing: ease.in, fill: "forwards" });
        out.onfinish = () => {
          ns.textContent = lbl;
          out.cancel();
          ns.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 600, easing: ease.out });
        };
      } else ns.textContent = lbl;
    }

    if (on && G.para && C.words.length) {
      const n = C.words.length;
      const top = G.para.top - sy;
      const prog = Math.min(1, Math.max(0, (vh * 0.85 - top) / (vh * 0.6)));
      const lit = prog * n * 1.1;
      C.words.forEach((w, j) => {
        const o = (0.16 + 0.84 * Math.min(1, Math.max(0, lit - j))).toFixed(2);
        if (w.style.opacity !== o) w.style.opacity = o;
      });
    }

    if (C.mark && G.foot && on) {
      const p = Math.min(1, Math.max(0, (vh - (G.foot.top - sy)) / G.foot.h));
      C.mark.style.transform = `translate3d(0,${((1 - p) * 60).toFixed(2)}%,0)`;
    }

    let k = 0;
    let bd = Infinity;
    G.ovx.forEach((g, j) => {
      const top = g.top - sy;
      if (top + g.h < 0 || top > vh) return;
      const d = Math.abs(top + g.h / 2 - vh / 2);
      if (d < bd) {
        bd = d;
        k = j;
      }
    });
    if (bd === Infinity) k = 0;
    if (this.knot) this.knot.orient = this.o.orients[k];
    if (C.num && k !== this.detK) {
      this.detK = k;
      C.num.firstChild!.textContent = String(k + 1).padStart(2, "0") + " ";
    }
  }
}
