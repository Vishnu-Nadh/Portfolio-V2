# Vishnu Nadh — Portfolio

Next.js implementation of the Claude Design file `Portfolio v3.dc.html`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure

| Path | What lives there |
| --- | --- |
| `src/content/site.ts` | **All copy and data** — profile, socials, sections, capabilities, stats, jobs, about, contact copy, cursor labels. Edit content here only. |
| `src/config/motion.ts` | Motion feature switches (comet tail, intro, reveals, seal cursor, badge spin). |
| `src/design-system/tokens.css` / `tokens.ts` | Colour, type, easing and layout tokens (CSS variables + JS mirror for WebGL/canvas). |
| `src/design-system/typography.module.css` | Type primitives: `label`, `body`, `display`, `accent`, `tabular`. |
| `src/design-system/primitives.tsx` | `SectionTag`, `Mask`, `Rule`, `UnderlineLink`, `Monogram`, `Seal`. |
| `src/components/sections/*` | Hero, Intro, Overview (What I do), Impact, Experience, About, Contact. |
| `src/components/chrome/*` | Fixed nav, fullscreen menu, overlays (cursor seal, preloader, cut, toast, trails). |
| `src/components/three/*` | WebGL scenes (three.js): the self-solving copper Rubik's cube on "What I do" (posed by scroll) and the contact-form knot that reacts to focus, typing, taps and invalid submits. |
| `src/components/background/*`, `src/lib/aurora/*` | Page-wide copper aurora (fixed WebGL layer, 30fps, low-res). Also an optional cursor-reactive fluid behind hero + intro, off by default (`motionSettings.heroFluid`); when on, it lazy-loads after first paint and is skipped on ≤4-core devices, software renderers, without WebGL2, or with reduced motion (and removes itself below 24fps). |
| `src/lib/motion/engine.ts` | Motion layer: Lenis smooth scroll (incl. anchor glides), intro, lit words, cursor, comet, hero lens + grain, scroll-velocity skew and section clip, menu cut, stage-object pose. Talks to markup through `data-*` attributes (documented at the top of the file). |
| `src/lib/motion/reveal.ts` | Scroll reveals (letter-by-letter rises, fades, small-label scramble, `data-seq` chains) and count-ups: one timing scale, played by CSS transitions as each element crosses a single trigger line (78% of the viewport). |
| `src/app/globals.css` | Base styles and the responsive layer (`[data-r]` hooks, breakpoints 1180/1024/820/560). |
| `src/app/api/contact/route.ts` | Contact endpoint with shared validation (`src/lib/contact.ts`). |

## Contact form delivery

Notes are emailed via [Resend](https://resend.com), with reply-to set to the visitor. Set `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (and optionally `CONTACT_FROM_EMAIL` on a verified domain) — see `.env.example`. Without them, `npm run dev` logs notes on the server, while a production build answers `503` and the form tells the visitor to email instead.
