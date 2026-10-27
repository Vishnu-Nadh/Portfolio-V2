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
| `src/config/motion.ts` | Motion feature switches (comet tail, grain, lens, intro, reveals, seal cursor, badge spin). |
| `src/design-system/tokens.css` / `tokens.ts` | Colour, type, easing and layout tokens (CSS variables + JS mirror for WebGL/canvas). |
| `src/design-system/typography.module.css` | Type primitives: `label`, `body`, `display`, `accent`, `tabular`. |
| `src/design-system/primitives.tsx` | `SectionTag`, `Mask`, `Rule`, `UnderlineLink`, `Monogram`, `Seal`. |
| `src/components/sections/*` | Hero, Intro, Overview (What I do), Impact, Experience, About, Contact. |
| `src/components/chrome/*` | Fixed nav, fullscreen menu, overlays (cursor seal, preloader, cut, toast, trails). |
| `src/components/three/*` | Torus knot and contact "signal" WebGL scenes (three.js). |
| `src/lib/motion/engine.ts` | Motion layer: Lenis smooth scroll, intro, lit words, cursor, lens, grain, comet, menu cut. Talks to markup through `data-*` attributes (documented at the top of the file). |
| `src/lib/motion/reveal.ts` | Scroll reveals and count-ups: IntersectionObserver + CSS transitions, tuned per section. |
| `src/app/globals.css` | Base styles and the responsive layer (`[data-r]` hooks, breakpoints 1180/1024/820/560). |
| `src/app/api/contact/route.ts` | Contact endpoint with shared validation (`src/lib/contact.ts`). |

## Contact form delivery

Set `CONTACT_WEBHOOK_URL` (see `.env.example`) to forward notes as JSON to Slack, Discord, Zapier, etc. Without it, `npm run dev` logs notes on the server, while a production build answers `503` and the form tells the visitor to email instead — set the variable before deploying.
