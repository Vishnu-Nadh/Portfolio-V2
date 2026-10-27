import localFont from "next/font/local";

/**
 * Self-hosted latin subsets of the design's Google Fonts (all SIL OFL), so
 * text renders without a third-party, render-blocking stylesheet.
 * Exposed as CSS variables consumed by the type tokens in tokens.css.
 */

/** Display face for headings and numerals. Variable weight 400–800. */
export const bigShouldersDisplay = localFont({
  src: "./fonts/big-shoulders-display-latin-var.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--font-big-shoulders-display",
  adjustFontFallback: "Arial",
});

/** Condensed reading copy. */
export const barlowCondensed = localFont({
  src: [
    { path: "./fonts/barlow-condensed-latin-300.woff2", weight: "300" },
    { path: "./fonts/barlow-condensed-latin-400.woff2", weight: "400" },
    { path: "./fonts/barlow-condensed-latin-500.woff2", weight: "500" },
  ],
  display: "swap",
  variable: "--font-barlow-condensed",
  adjustFontFallback: "Arial",
});

/** UI face. Variable weight 300–900 and width 62–125% (labels use font-stretch: 125%). */
export const archivo = localFont({
  src: "./fonts/archivo-latin-var.woff2",
  weight: "300 900",
  display: "swap",
  variable: "--font-archivo",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  adjustFontFallback: "Arial",
});

export const fontVariables = [bigShouldersDisplay.variable, barlowCondensed.variable, archivo.variable].join(" ");
