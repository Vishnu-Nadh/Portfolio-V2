/**
 * JS mirror of the CSS tokens in tokens.css, for consumers that can't read
 * CSS variables (WebGL materials, canvas, Web Animations).
 */
export const color = {
  black: "#020202",
  overlay: "#0a0a0a",
  bg: "#111111",
  surface1: "#151515",
  surface2: "#181818",
  surface3: "#1a1a1a",
  lineFaint: "#1c1c1c",
  lineSoft: "#1f1f1f",
  line: "#222222",
  lineMuted: "#262626",
  lineStrong: "#2c2c2b",
  rule: "#3a3a39",
  textGhost: "#4a4a48",
  textDim: "#6e6e6c",
  textMuted: "#8a8a88",
  textSoft: "#a6a6a4",
  text: "#d0d0ce",
  textStrong: "#e6e6e4",
  accent: "#c8875a",
  accentPressed: "#8a6248",
  error: "#d97a5e",
} as const;

/** Ambient aurora palette: copper field, page ink, pale copper veil. */
export const aurora = {
  primary: "#8c4a22",
  base: "#0b0a0a",
  highlight: "#e3b38f",
} as const;

/** Motion curves. `out`/`inOut` mirror --ease-out / --ease-in-out. */
export const ease = {
  /** Expo out — rises, intro, ticker settle. */
  out: "cubic-bezier(.16,1,.3,1)",
  /** Expo in-out — UI transitions. */
  inOut: "cubic-bezier(.83,0,.17,1)",
  /** Steeper in-out — rule draws, preloader wipe. */
  inOutStrong: "cubic-bezier(.87,0,.13,1)",
  /** Cubic out — fade reveals. */
  fade: "cubic-bezier(.33,1,.68,1)",
  /** Cubic in — ticker exit. */
  in: "cubic-bezier(.32,0,.67,0)",
} as const;

/** The design's earlier curves, still used by the menu cut, "thank you" rise and pulse dot. */
export const legacyEase = {
  out: "cubic-bezier(.2,.8,.2,1)",
  inOut: "cubic-bezier(.76,0,.24,1)",
} as const;

/** Expo-out, used for Lenis anchor glides. */
export const expoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Breakpoints used by the responsive layer (max-width). */
export const breakpoint = {
  wide: 1180,
  tablet: 1024,
  mobile: 820,
  small: 560,
} as const;
