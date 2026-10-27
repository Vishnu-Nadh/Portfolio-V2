import { ease } from "@/design-system/tokens";
import { isDisplayFace } from "./displayFace";

/**
 * Scroll reveals and count-ups. Elements are parked off-state once, then an
 * IntersectionObserver hands each one a CSS transition when it enters. A slow
 * poll ("safety net") catches anything the observer misses (fast jumps,
 * layout shifts) and stops itself once everything has played.
 */

type Tuning = { rise: number; fade: number; fy: number; line: number; wt: number; ls?: number };
type Kind = "rise" | "line" | "fade";
type RevealEl = HTMLElement & { _cfg?: { kind: Kind; C: Tuning; d: number }; _rv?: RevealEl[] };
type CountEl = HTMLElement & { _ct?: ReturnType<typeof setInterval> };

/** Durations (ms) and fade distance (px) per section id; `ls` staggers rules. */
const TUNING: Record<string, Tuning> = {
  intro: { rise: 1700, fade: 1300, fy: 32, line: 1800, wt: 2200 },
  overview: { rise: 1400, fade: 1100, fy: 24, line: 1400, wt: 1800 },
  impact: { rise: 1500, fade: 1100, fy: 18, line: 1600, wt: 2000 },
  work: { rise: 1400, fade: 1000, fy: 20, line: 1500, wt: 1800, ls: 100 },
  about: { rise: 1400, fade: 1200, fy: 16, line: 1400, wt: 1800 },
  contact: { rise: 1700, fade: 1100, fy: 24, line: 1800, wt: 2200 },
  _: { rise: 1400, fade: 1100, fy: 24, line: 1500, wt: 1800 },
};

const kindOf = (el: Element): Kind => (el.hasAttribute("data-rise") ? "rise" : el.hasAttribute("data-line") ? "line" : "fade");
const targetOf = (el: HTMLElement) => (kindOf(el) === "rise" ? el.parentElement! : el);

function play(el: RevealEl) {
  const c = el._cfg;
  if (!c || el.dataset.rv === "in") return;
  el.dataset.rv = "in";
  const { kind, C, d } = c;
  void el.offsetWidth; // commit the parked state before transitioning
  if (kind === "rise") {
    el.style.transition = `transform ${C.rise}ms ${ease.out} ${d}ms` + (el.dataset.wt0 ? `, font-weight ${C.wt}ms ${ease.out} ${d + 100}ms` : "");
    el.style.transform = "none";
    if (el.dataset.wt0) el.style.fontWeight = el.dataset.wt0;
  } else if (kind === "line") {
    el.style.transition = `transform ${C.line}ms ${ease.inOutStrong} ${d}ms`;
    el.style.transform = "none";
  } else {
    el.style.transition = `opacity ${C.fade}ms ${ease.fade} ${d}ms, transform ${C.fade + 150}ms ${ease.out} ${d}ms`;
    el.style.opacity = "";
    el.style.transform = "none";
  }
}

function runCount(el: CountEl) {
  if (el.dataset.gc) return;
  el.dataset.gc = "run";
  const to = parseInt(el.dataset.count!, 10);
  const t0 = performance.now() + 350;
  const step = () => {
    const p = Math.max(0, Math.min(1, (performance.now() - t0) / 2400));
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = String(Math.round(to * e));
    if (p >= 1) {
      el.dataset.gc = "done";
      clearInterval(el._ct);
    }
  };
  const raf = () => {
    step();
    if (el.dataset.gc === "run") requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  // Keeps counting when rAF is throttled (background tab, low-power mode).
  el._ct = setInterval(step, 120);
}

/** Parks every reveal below the fold and starts observing. Returns a teardown. */
export function startReveals() {
  const vh = innerHeight;
  const io = new IntersectionObserver(
    (ents) =>
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        ((en.target as RevealEl)._rv || []).forEach(play);
      }),
    { rootMargin: "0px 0px -12% 0px" },
  );

  const lineIdx: Record<string, number> = {};
  document.querySelectorAll<RevealEl>("[data-reveal],[data-rise],[data-line]").forEach((el) => {
    if (el.closest("[data-menu]") || el.dataset.rv) return;
    const kind = kindOf(el);
    const tgt = targetOf(el) as RevealEl;
    if (tgt.getBoundingClientRect().top < vh * 0.88) {
      el.dataset.rv = "in";
      return;
    }
    const sec = el.closest("section,header,footer");
    const sid = (sec && sec.id) || "_";
    const C = TUNING[sid] || TUNING._;
    let d = parseInt(el.dataset.d!, 10) || 0;
    if (kind === "line" && C.ls) {
      lineIdx[sid] = (lineIdx[sid] || 0) + 1;
      d += (lineIdx[sid] - 1) * C.ls;
    }
    el._cfg = { kind, C, d };
    el.style.transition = "none";
    if (kind === "rise") {
      el.style.transform = "translate3d(0,175%,0)";
      if (isDisplayFace(el)) {
        if (!el.dataset.wt0) el.dataset.wt0 = el.style.fontWeight || getComputedStyle(el).fontWeight || "600";
        el.style.fontWeight = "400";
      }
    } else if (kind === "line") el.style.transform = "scaleX(0)";
    else {
      el.style.opacity = "0";
      el.style.transform = `translate3d(0,${C.fy}px,0)`;
    }
    el.dataset.rv = "wait";
    tgt._rv = (tgt._rv || []).concat(el);
    io.observe(tgt);
  });

  const cio = new IntersectionObserver(
    (ents) =>
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        runCount(en.target as CountEl);
      }),
    { rootMargin: "0px 0px -15% 0px" },
  );
  document.querySelectorAll<CountEl>("[data-count]").forEach((el) => {
    if (el.getBoundingClientRect().top > vh * 0.85) {
      el.textContent = "0";
      cio.observe(el);
    } else el.dataset.gc = "done";
  });

  let net: ReturnType<typeof setInterval> | null = setInterval(() => {
    const h = innerHeight;
    let left = 0;
    document.querySelectorAll<RevealEl>('[data-rv="wait"]').forEach((el) => {
      left++;
      const r = targetOf(el).getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) play(el);
    });
    document.querySelectorAll<CountEl>("[data-count]").forEach((el) => {
      if (el.dataset.gc) return;
      left++;
      const r = el.getBoundingClientRect();
      if (r.top < h && r.bottom > 0) {
        cio.unobserve(el);
        runCount(el);
      }
    });
    if (!left && net) {
      clearInterval(net);
      net = null;
    }
  }, 600);

  return () => {
    io.disconnect();
    cio.disconnect();
    if (net) clearInterval(net);
    // Undo parked state so a remount (React Strict Mode in dev) starts clean.
    document.querySelectorAll<RevealEl>('[data-rv="wait"]').forEach((el) => {
      el.style.transition = el.style.transform = el.style.opacity = "";
      if (el.dataset.wt0) el.style.fontWeight = "";
      delete el.dataset.rv;
      delete el._cfg;
      (targetOf(el) as RevealEl)._rv = undefined;
    });
    document.querySelectorAll<CountEl>("[data-count]").forEach((el) => {
      clearInterval(el._ct);
      if (el.dataset.gc !== "done") {
        delete el.dataset.gc;
        el.textContent = el.dataset.count!;
      }
    });
  };
}
