import { reveal } from "@/design-system/tokens";
import { isDisplayFace } from "./displayFace";

/**
 * Scroll reveals and count-ups. Elements are parked off-state once; each one
 * plays (a CSS transition) when its top crosses one trigger line. The engine
 * calls `check` every frame, and a slow poll keeps it going while rAF is
 * paused (background tab), stopping once everything has played.
 *
 * Kinds: [data-rise] masked rise ([data-split] rises letter by letter),
 * [data-line] rule draw, [data-reveal] fade + lift + slight blur (small labels
 * also scramble into place). [data-seq="name"] chains a group: when any member
 * triggers, the whole group plays in DOM order, each starting halfway through
 * the previous one.
 */

/** One motion system, one duration scale (ms): glyph rise + ≤`spread` letter spread, line draw, block fade (`fy` lift); stagger ≤`dmax`. */
const M = { cs: 30, spread: 360, rise: 900, fade: 700, fy: 9, line: 900, wt: 1100, ls: 60, dmax: 480 };
/** Reveals and counters play once their top passes this fraction of the viewport height. */
const TRIGGER = 0.78;

type Kind = "rise" | "line" | "fade";
type RevealEl = HTMLElement & { _cfg?: { kind: Kind; d: number }; _rv?: RevealEl[]; _scr?: boolean; _cs?: number; _done?: boolean };
type CountEl = HTMLElement & { _ct?: ReturnType<typeof setInterval> };

const kindOf = (el: Element): Kind => (el.hasAttribute("data-rise") ? "rise" : el.hasAttribute("data-line") ? "line" : "fade");
const targetOf = (el: HTMLElement) => (kindOf(el) === "rise" ? el.parentElement! : el) as RevealEl;
const charsOf = (el: Element) => (el.hasAttribute("data-split") ? [...el.querySelectorAll<HTMLElement>("[data-ch]")] : null);

/** Types a short label into place through random glyphs. */
function scramble(el: HTMLElement) {
  const G = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789/#+=";
  const nodes: { n: Text; v: string; last: string | null }[] = [];
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const n = tw.currentNode as Text;
    if (n.nodeValue!.trim()) nodes.push({ n, v: n.nodeValue!, last: null });
  }
  if (!nodes.length) return;
  const t0 = performance.now();
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / 500);
    nodes.forEach((o) => {
      if (o.last !== null && o.n.nodeValue !== o.last) return;
      const keep = Math.floor(o.v.length * p);
      const s =
        p >= 1
          ? o.v
          : o.v.slice(0, keep) +
            [...o.v.slice(keep)].map((ch) => (/\s|—|\//.test(ch) ? ch : G[(Math.random() * G.length) | 0])).join("");
      o.n.nodeValue = s;
      o.last = s;
    });
    if (p < 1) requestAnimationFrame(step);
  };
  step();
}

function play(el: RevealEl) {
  const c = el._cfg;
  if (!c || el.dataset.rv === "in") return;
  el.dataset.rv = "in";
  const { kind, d } = c;
  void el.offsetWidth; // commit the parked state before transitioning
  const chars = kind === "rise" ? charsOf(el) : null;
  if (chars) {
    const cs = Math.min(M.cs, M.spread / Math.max(1, chars.length));
    el._cs = cs;
    chars.forEach((ch, i) => {
      const dl = d + Math.round(i * cs);
      ch.style.transition = `transform ${M.rise}ms ${reveal.out} ${dl}ms, opacity ${Math.round(M.rise * 0.45)}ms ${reveal.fade} ${dl}ms`;
      ch.style.transform = "none";
      ch.style.opacity = "1";
    });
    setTimeout(
      () =>
        chars.forEach((ch) => {
          ch.style.willChange = "";
          ch.style.transition = "";
        }),
      d + chars.length * cs + M.rise + 400,
    );
  } else if (kind === "rise") {
    el.style.transition = `transform ${M.rise}ms ${reveal.out} ${d}ms` + (el.dataset.wt0 ? `, font-weight ${M.wt}ms ${reveal.out} ${d + 100}ms` : "");
    el.style.transform = "none";
    if (el.dataset.wt0) el.style.fontWeight = el.dataset.wt0;
  } else if (kind === "line") {
    el.style.transition = `transform ${M.line}ms ${reveal.line} ${d}ms`;
    el.style.transform = "none";
  } else {
    el.style.transition = `opacity ${M.fade}ms ${reveal.fade} ${d}ms, transform ${M.fade + 150}ms ${reveal.out} ${d}ms, filter ${Math.round(M.fade * 0.8)}ms ${reveal.fade} ${d}ms`;
    el.style.opacity = "";
    el.style.transform = "none";
    el.style.filter = "blur(0)";
    setTimeout(() => {
      el.style.filter = "";
      el.style.willChange = "";
      el.style.transition = "";
    }, d + M.fade + 400);
    if (el._scr) setTimeout(() => scramble(el), d);
  }
}

/** Plays `el`, or its whole [data-seq] group as a chain. */
function playSeq(el: RevealEl) {
  const g = el.dataset.seq;
  if (!g) return play(el);
  let t = 0;
  document.querySelectorAll<RevealEl>(`[data-seq="${g}"]`).forEach((x) => {
    if (!x._cfg || x.dataset.rv === "in") return;
    x._cfg.d = t;
    targetOf(x)._done = true;
    play(x);
    t += Math.round(((charsOf(x)?.length ?? 0) * (x._cs || M.cs) + M.rise) * 0.5);
  });
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

/** Parks every reveal below the trigger line. Returns the per-frame check and a teardown. */
export function startReveals() {
  const vh = innerHeight;
  let revWait: RevealEl[] = [];
  let cntWait: CountEl[] = [];

  const lineIdx: Record<string, number> = {};
  document.querySelectorAll<RevealEl>("[data-reveal],[data-rise],[data-line]").forEach((el) => {
    if (el.closest("[data-menu]") || el.dataset.rv) return;
    const kind = kindOf(el);
    const tgt = targetOf(el);
    if (tgt.getBoundingClientRect().top < vh * TRIGGER) {
      el.dataset.rv = "in";
      return;
    }
    let d = Math.min(M.dmax, Math.round((parseInt(el.dataset.d!, 10) || 0) * 0.6));
    if (kind === "line") {
      const sid = el.closest("section,header,footer")?.id || "_";
      lineIdx[sid] = (lineIdx[sid] || 0) + 1;
      d += Math.min(M.dmax, (lineIdx[sid] - 1) * M.ls);
    }
    el._cfg = { kind, d };
    el.style.transition = "none";
    const chars = kind === "rise" ? charsOf(el) : null;
    if (chars) {
      chars.forEach((ch, i) => {
        ch.style.transition = "none";
        ch.style.transform = `translate3d(0,110%,0) rotate(${i % 2 ? 7 : 4}deg) scaleY(1.25)`;
        ch.style.opacity = "0";
        ch.style.willChange = "transform,opacity";
      });
    } else if (kind === "rise") {
      el.style.transform = "translate3d(0,175%,0)";
      if (isDisplayFace(el)) {
        if (!el.dataset.wt0) el.dataset.wt0 = el.style.fontWeight || getComputedStyle(el).fontWeight || "600";
        el.style.fontWeight = "400";
      }
    } else if (kind === "line") el.style.transform = "scaleX(0)";
    else {
      el.style.opacity = "0";
      el.style.transform = `translate3d(0,${M.fy * 1.8}px,0)`;
      el.style.filter = "blur(4px)";
      el.style.willChange = "transform,opacity,filter";
      el._scr = parseFloat(getComputedStyle(el).fontSize) <= 12 && el.textContent!.trim().length < 48 && !el.querySelector("input,textarea,button");
    }
    el.dataset.rv = "wait";
    tgt._rv = (tgt._rv || []).concat(el);
    if (!revWait.includes(tgt)) revWait.push(tgt);
  });

  document.querySelectorAll<CountEl>("[data-count]").forEach((el) => {
    if (el.getBoundingClientRect().top > vh * 0.85) {
      el.textContent = "0";
      cntWait.push(el);
    } else el.dataset.gc = "done";
  });

  const check = () => {
    if (!revWait.length && !cntWait.length) return;
    const H = innerHeight;
    // Content below the line at the very bottom of the page can never cross it, so there anything on screen plays.
    const line = scrollY + H >= document.documentElement.scrollHeight - 2 ? H : H * TRIGGER;
    if (revWait.length) {
      revWait
        .filter((t) => !t._done && t.getBoundingClientRect().top < line)
        .forEach((t) => {
          t._done = true;
          (t._rv || []).forEach(playSeq);
        });
      revWait = revWait.filter((t) => !t._done);
    }
    if (cntWait.length)
      cntWait = cntWait.filter((el) => {
        if (el.getBoundingClientRect().top >= line) return true;
        runCount(el);
        return false;
      });
  };

  let net: ReturnType<typeof setInterval> | null = setInterval(() => {
    check();
    if (!revWait.length && !cntWait.length && net) {
      clearInterval(net);
      net = null;
    }
  }, 600);

  const stop = () => {
    if (net) clearInterval(net);
    revWait = [];
    cntWait = [];
    // Undo parked state so a remount (React Strict Mode in dev) starts clean.
    document.querySelectorAll<RevealEl>('[data-rv="wait"]').forEach((el) => {
      el.style.transition = el.style.transform = el.style.opacity = el.style.filter = el.style.willChange = "";
      if (el.dataset.wt0) el.style.fontWeight = "";
      charsOf(el)?.forEach((ch) => {
        ch.style.transition = ch.style.transform = ch.style.opacity = ch.style.willChange = "";
      });
      delete el.dataset.rv;
      delete el._cfg;
      const tgt = targetOf(el);
      tgt._rv = undefined;
      tgt._done = undefined;
    });
    document.querySelectorAll<CountEl>("[data-count]").forEach((el) => {
      clearInterval(el._ct);
      if (el.dataset.gc !== "done") {
        delete el.dataset.gc;
        el.textContent = el.dataset.count!;
      }
    });
  };

  return { check, stop };
}
