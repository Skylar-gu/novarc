# BUILD PLAN — Phase 1: static replica of novarc.tech

Operational plan for building the site described in [`SPEC.md`](SPEC.md). Every
contributor (human or agent) reads this file **and** `SPEC.md` before touching code.
Product model is in [`PRODUCT.md`](PRODUCT.md); the thesis the site must carry is in
[`VISION.md`](VISION.md).

---

## 0. Non-negotiables

1. **All prose is original.** Reproduce novarc.tech's *information architecture, section
   order, argument, and voice register* — never its sentences. No string from the live
   site may appear verbatim in this repo. When in doubt, rewrite. (`scratch/` holds the
   reference extraction, gitignored, for comparison only.)
2. **Voice:** declarative, austere, precise. Short sentences. No exclamation marks, no
   emoji, minimal adjectives. Claims are hedged exactly ("scored only where the
   conversation offered the opportunity"). It should read like an instrument's manual,
   not a launch page.
3. **Design tokens only.** No hardcoded colors, spacing, or font families in components
   — everything through the CSS custom properties / Tailwind theme defined in WP-1.
4. **Both themes always.** Light (`#faf9f5` ground) and dark must both render correctly
   for every component. Define dark explicitly; never rely on inversion.
5. **`prefers-reduced-motion` is respected** by every animation.
6. **Definition of done for every WP:** `npm run build` passes · `npm run lint` clean ·
   `tsc --noEmit` clean · renders 375–1440px wide · both themes · keyboard-navigable.

---

## 1. Stack (fixed — do not deviate without a note in `BUILD_NOTES.md`)

| Concern | Choice |
|---|---|
| Framework | Next.js (latest), App Router, React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) + `app/globals.css` for tokens |
| Fonts | `next/font/google` — serif **Newsreader** (true italics, for accent words + pull quotes), sans **Inter** (everything else). Documented fallback stacks. These are stand-ins for NOVARC's licensed faces. |
| Animation | CSS only + one `useInView` IntersectionObserver hook. No animation library. |
| Charts | Hand-built inline SVG per the `dataviz` skill. No charting library. |
| Waitlist | Client form → Route Handler `POST /api/waitlist` → append JSONL to a local file. Email validation + honeypot. Real backend is later. |
| Lint | ESLint (`next/core-web-vitals`) + Prettier |
| Icons/mark | Original geometric NOVARC wordmark + mark as inline SVG. Do not trace the real logo. |

---

## 2. Work packages

Dependency order: **WP-1 → WP-2 → {WP-3, WP-4, WP-5, WP-6} → WP-7.**
WP-3..6 run in parallel; each stays strictly in its file lane (§3).

### WP-1 — Scaffold, chrome, design system
- `create-next-app` (TS, App Router, Tailwind, ESLint, `src/`-less — use root `app/`).
- `app/globals.css`: full token set — ground/surface/text/border/accent, light on
  bare `:root`, dark under both `@media (prefers-color-scheme: dark)` guarded by
  `:root:not([data-theme="light"])` and `:root[data-theme="dark"]`. Ground `#faf9f5`.
- Fonts wired via `next/font`, exposed as `--font-serif` / `--font-sans`.
- Theme system: `data-theme` on `<html>`, no-flash inline script, `<ThemeToggle>` in
  header, respects system default when unset.
- Chrome components in `components/chrome/`: `TopRibbon` (dismissible, localStorage),
  `Header` (wordmark + "Zürich · Founded 2026" + nav [Home, Product, About, Research] +
  "Get updates" button + `ThemeToggle`), `Footer` (identity line + Explore column +
  "© 2026 NOVARC · Engineering intelligence").
- `app/layout.tsx` wiring ribbon + header + `{children}` + footer; metadata base.
- UI primitives in `components/ui/`: `Container`, `Section` (numbered-section motif with
  optional `index` + eyebrow), `Button`/`LinkButton`, `Prose`.
- `lib/`: `useInView` hook, `cn` class helper, site config (nav items, waitlist copy).
- A holding `app/page.tsx` ("Home — under construction") so the app boots.
- **DoD:** `npm run dev` serves; `npm run build` passes; toggle works with no FOUC;
  ribbon dismiss persists; lints clean.

### WP-2 — Shared component library (`components/blocks/`)
Build every reusable block with sensible props, sample/placeholder original copy in a
Storybook-less `app/_kitchen-sink/page.tsx` (dev-only, excluded from nav/sitemap) so
each can be viewed in isolation and both themes.
- `Hero` — masked word-rise headline (`--w` stagger), one `<em>` accent word, sub +
  two CTAs. Reduced-motion → plain fade.
- `PrincipleStatement` — oversized numbered statement.
- `SignalCard` — index / name / plain-language gloss / body. (Load, Rigor, Drift.)
- `PhaseCard` — roadmap item + state note.
- `PrincipleGrid` — 2×2.
- `StatCard` — finding + source attribution.
- `StudyCard` — citation / finding / pull-quote / external link.
- `FindingCard` — cognitive-science finding + researcher line.
- `InterfacePreview` — device frame (desktop + mobile variants) wrapping a **built,
  not screenshotted** miniature of the instrument UI (Load/Rigor readouts + a receipt
  excerpt). Original mock data.
- `FAQItem` / `FAQ` — accessible accordion (`<details>`-based or ARIA disclosure).
- `WaitlistForm` — email + honeypot; posts to `/api/waitlist`; success/error/loading
  states; used in 4 placements.
- `HouseSection` — "one company, every build" band.
- `ScrollReveal` — wrapper using `useInView`.
- **DoD:** kitchen-sink page shows all blocks in both themes; `/api/waitlist` route
  handler implemented + validates; build/lint clean.

### WP-3 — Home (`app/page.tsx` + `components/home/`)
11 sections in `SPEC.md` §2.2 order. Assembles WP-2 blocks. Original copy carrying the
convenience-vs-capability argument, the three signals, the roadmap, the four principles,
the research stat cards (+ chart slots — import from WP-6's `components/charts/`, or
render a labelled placeholder box with a `// TODO WP-6` if not yet merged), the house
band, closing CTA.

### WP-4 — Product (`app/product/page.tsx` + `components/product/`)
`SPEC.md` §2.3 map: hero → "what it is" → interface preview → three signals (full) →
"the standard" (most sessions unscored; no score without a receipt) → second preview →
"measurement, then intervention" → "in validation" (four methods; results published
regardless) → CTA. Copy from `PRODUCT.md`, reworded.

### WP-5 — About (`app/about/page.tsx` + `components/about/`)
`SPEC.md` §2.3 map: hero → "technology that leaves people more capable" (cognitive-
outsourcing argument + ship rule) → "one house, many builds" (3 cards) → six outcomes
(numbered) → 8-item FAQ (content from `SPEC.md` §2.3 about-FAQ list, reworded) →
"built in Zürich, built for the world" → CTA.

### WP-6 — Research (`app/research/page.tsx` + `components/research/` + `components/charts/`)
`SPEC.md` §2.3 map: hero → "evidence is converging" → two `StudyCard`s (MIT Media Lab —
*Your Brain on ChatGPT*, Kosmyna et al. 2025; Microsoft × CMU — Lee et al., CHI 2025)
with **links to the primary sources** (URLs in `SPEC.md` §2.3) → standard statement →
three `FindingCard`s (Schultz prediction error; Kapur productive failure; Schraw/
Dunlosky/Bjork calibration) → "five areas, one conviction" → CTA.
**Two charts** (`components/charts/`), built per the `dataviz` skill from the primary
studies, not from novarc.tech's rendering:
1. "Couldn't recall their own essay, by group" — bar, MIT EEG study, n=54. Use figures
   from the paper; if a value is unavailable, label it illustrative.
2. "Trust in AI vs. critical-thinking effort" — relationship plot, Lee et al. CHI 2025.
Both: theme-aware tokens, `<title>`/`<desc>`, reduced-motion safe, horizontal scroll
container if needed. Cite the source under each figure.

### WP-7 — Polish
Metadata + OpenGraph per route, `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx`,
favicon/mark assets, focus-visible styles, heading-order audit, `prefers-reduced-motion`
sweep, Lighthouse (target ≥95 a11y / best-practices / SEO), responsive sweep at 375 /
768 / 1024 / 1440, dark/light parity screenshot check, remove `_kitchen-sink` from any
crawlable surface.

---

## 3. File-lane ownership (parallel-safe)

| Path | Owner |
|---|---|
| `app/layout.tsx`, `app/globals.css`, `next.config.*`, `tailwind`/`postcss` config, `tsconfig`, `.eslintrc`, `package.json` | WP-1 (others: request changes in `BUILD_NOTES.md`) |
| `components/chrome/**`, `components/ui/**`, `lib/**` | WP-1 |
| `components/blocks/**`, `app/_kitchen-sink/**`, `app/api/waitlist/**` | WP-2 |
| `app/page.tsx`, `components/home/**` | WP-3 |
| `app/product/**`, `components/product/**` | WP-4 |
| `app/about/**`, `components/about/**` | WP-5 |
| `app/research/**`, `components/research/**`, `components/charts/**` | WP-6 |
| metadata files, `not-found`, `sitemap`, `robots`, `public/**` assets, cross-cutting a11y | WP-7 |

If a WP needs something outside its lane: append a dated entry to `BUILD_NOTES.md`
(request / decision / assumption) rather than editing another lane's files.

---

## 4. Orchestration

- **Builder agent per WP** — background, full brief, stays in its lane, commits nothing
  (orchestrator commits).
- **One persistent QA/monitor agent** — seeded with `SPEC.md` / `PRODUCT.md` /
  `VISION.md` / this file / the `scratch/` reference. After each WP lands it re-reviews
  the *whole* working tree against: SPEC fidelity · original-copy check (grep vs.
  `scratch/`) · voice · token discipline · a11y basics · build/lint health · vision
  alignment. Continued across WPs via `SendMessage` so its context compounds.
- **Orchestrator (me)** — final gate: read the QA report, spot-check, run the build,
  fix or re-dispatch, then `git commit` the WP.
- **Cadence:** one wave at a time. No hurry. A WP is not "done" until QA + orchestrator
  both pass it and it's committed.

## 5. Progress log

| WP | Builder | QA verdict | Orchestrator | Commit |
|----|---------|-----------|--------------|--------|
| 1  | pending | — | — | — |
| 2  | — | — | — | — |
| 3  | — | — | — | — |
| 4  | — | — | — | — |
| 5  | — | — | — | — |
| 6  | — | — | — | — |
| 7  | — | — | — | — |
