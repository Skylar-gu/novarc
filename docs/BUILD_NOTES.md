# BUILD NOTES

Dated log of decisions, deviations from `BUILD_PLAN.md`, and cross-lane requests.
Append; do not rewrite history.

---

## 2026-09-01 — WP-1 (scaffold, chrome, design system)

### Stack versions installed

`create-next-app@latest` resolved to **Next.js 16.3.4**, **React 19.2.8**,
**react-dom 19.2.8**, **Tailwind CSS v4** (`@tailwindcss/postcss ^4`),
**TypeScript ^5**, **ESLint ^9** (`eslint-config-next 16.3.4`).

Exact command (run in a temp dir, then files moved into the repo because the
working tree already contained `.git/`, `docs/`, `scratch/`, `README.md`,
`.gitignore`):

```
npx create-next-app@latest novarc-scaffold \
  --typescript --eslint --tailwind --app --no-src-dir \
  --turbopack --import-alias "@/*" --use-npm --disable-git
```

### Deviations from the fixed stack / plan

1. **Next 16 build engine.** `next build` now uses Turbopack by default (the
   build banner confirms "(Turbopack)"), so no `--turbopack` flag is carried in
   the `package.json` scripts. `dev` is Turbopack by default too.
2. **`next lint` removed in Next 16.** The `lint` script is plain `eslint`
   (this is what `create-next-app` generated). `npm run lint` is the DoD gate
   and is clean.
3. **`LayoutProps<"/">` not used.** `create-next-app` typed the root layout with
   the `.next/types` generated global `LayoutProps`. That makes a cold
   `npx tsc --noEmit` (no prior build) fail. Replaced with an explicit
   `Readonly<{ children: ReactNode }>` so the typecheck passes standalone.
4. **eslint-plugin-react-hooks v6 strictness.** The Next 16 config enables
   `react-hooks/set-state-in-effect` and `react-hooks/refs`, which reject the
   usual "read localStorage / DOM after mount" and "previous-value ref" idioms.
   Resulting patterns:
   - `ThemeToggle` and `TopRibbon` read their persisted state via
     `useSyncExternalStore` (server snapshot = "system" / ribbon-open, client
     snapshot = localStorage). No mount effect, no hydration warning, no FOUC.
   - `Header` closes the mobile menu on route change by adjusting state during
     render against a `seenPath` state value (the React-sanctioned
     alternative to a route-change effect), not a ref.
   - `useInView` defers its no-IntersectionObserver fallback `setState` to
     `requestAnimationFrame` so it is not a synchronous effect-body call.
5. **`next.config.ts` → `agentRules: false`.** `next dev` in Next 16 writes
   `AGENTS.md` + `CLAUDE.md` into the repo root on every run. Disabled so the
   tree stays clean; the generated files were deleted.
6. **Removed `create-next-app` boilerplate:** default `app/page.tsx` body,
   `public/*.svg` (the `public/` dir is now absent — recreate under WP-7 for
   real assets), and the scaffold's own `README.md` / `AGENTS.md` / `CLAUDE.md`
   (repo `README.md` kept).
7. **`.gitignore`** — appended `.turbo/`, `*.tsbuildinfo`, `next-env.d.ts`,
   `.vercel` to the existing rules.
8. **`package.json` `name`** set to `novarc` (was `novarc-scaffold`).
9. **`cn` helper is minimal** — array flatten + falsy filter + join, no
   `clsx` / `tailwind-merge` dependency. Keep component variant class sets
   mutually exclusive rather than relying on "last class wins".

### Requests for other lanes

- **WP-3 (Home):** the header CTA, top ribbon, footer "Explore" column, and
  mobile menu all link to `/#waitlist`. Add `id="waitlist"` to the home closing
  section so those anchors land. `Section` supports an `id` prop for this.
- **WP-7:** `public/` was removed. Recreate it for favicon / mark / OG assets.
  `app/favicon.ico` (the create-next-app default) is still in place — replace it.
- **All page lanes:** consume colour and font only through the Tailwind
  utilities backed by tokens (`bg-ground`, `bg-surface`, `bg-surface-raised`,
  `text-text`, `text-text-muted`, `border-border`, `bg-accent`, `text-accent`,
  `bg-accent-soft`, `font-sans`, `font-serif`) or `var(--token)`. Accent words
  and pull quotes: use `<em>` / `<i>` / `<cite>` — globals.css already maps
  those to the serif italic.

---

## 2026-09-01 — Orchestrator, WP-1 gate (post-QA)

QA pass on WP-1 returned CHANGES REQUIRED (one blocking) + nits. Resolved:

1. **BLOCKING — verbatim live-site string.** `lib/site.ts` `title` was
   "NOVARC — AI that augments, not replaces" — the live site's exact `<title>`.
   Reworded to "NOVARC — AI that builds human capability". `description` also
   restructured to drop the dash-bracketed "AI — models, agents, and tools —"
   appositive that mirrored the live sentence.
2. `Wordmark.tsx` — SVG `<text>` now uses `style={{ fontFamily }}` instead of a
   bare `fontFamily` presentation attribute (reliable `var()` resolution).
3. `Header.tsx` — mobile `<nav>` relabelled `"Primary (mobile)"` so the two nav
   landmarks have unique accessible names (axe `landmark-unique`).
4. `TopRibbon.tsx` — message `<p>` is now `sm:truncate` (wraps on narrow
   screens) so the "Join the waitlist" link is never clipped at 375px.

### Copy policy — the "augmentation, not replacement" phrase (DECISION)

Tension: SPEC §1.2/§2.2 quote "AI that augments, not replaces." as the intended
hero headline; BUILD_PLAN §0.1 forbids verbatim live-site strings.

Ruling:
- The **concept** ("augmentation over replacement", "augment, don't replace")
  may appear in body copy as an idea — it is positioning, not protectable
  expression, and near-unavoidable when describing this thesis.
- The **verbatim marketing headline** "AI that augments, not replaces" is NOT
  used as our page `<title>` or as the WP-3 hero headline.
- **WP-3 hero headline (approved):** "AI that builds the person, not just the
  answer." — accent (serif-italic `<em>`) on *person*. Sub-headline: original
  wording carrying the models/agents/tools + "more capable each time you use it"
  argument, no dash-appositive construction.
- WP-4/5/6 may use the four-principle name "Augment, never replace" as a
  labelled principle (it is a heading/label, and the ideas are not
  protectable), but must reword all surrounding body copy.

### Backlogged to WP-7 (non-blocking QA nits)

- Route `Header` / `TopRibbon` width through `<Container width="wide">` so
  chrome width stays coupled to the primitive (currently `max-w-[80rem]`
  hardcoded in both).
- Header lockup sub-line (`site.location`) is `hidden sm:inline` — consider
  stacking it under the wordmark on mobile rather than dropping it.
- `LinkButton` external variant needs an "opens in new tab" affordance
  (visually-hidden text or `aria-describedby`) — matters for WP-6 study links.
- `Footer` "Explore" label is a `<p>`; a visually-hidden `<h2>` would be more
  conventional as the nav's programmatic label.
- Decide whether to reserve vertical space for `TopRibbon` to avoid first-visit
  CLS (server snapshot renders it closed).
- Confirm intended deploy domain for `metadataBase` (`site.url` currently
  points at the real `novarc.tech`).

---

## 2026-09-01 — WP-2 (shared component library)

### Files added (all in-lane)

- `components/blocks/` — `Hero`, `PrincipleStatement`, `SignalCard`,
  `PhaseCard`, `PrincipleGrid` + `PrincipleCard`, `StatCard`, `StudyCard`,
  `FindingCard`, `InterfacePreview`, `FAQ` + `FAQItem`, `WaitlistForm`,
  `HouseSection`, `ScrollReveal`, plus `shared.ts` (`formatIndex` helper).
- `app/api/waitlist/route.ts` — `POST` handler; appends one JSON line to
  `data/waitlist.jsonl` at repo root.
- `app/%5Fkitchen-sink/page.tsx` — dev preview of every block, routed at
  `/_kitchen-sink`. Has `metadata.robots = { index: false, follow: false }`;
  not linked from nav/footer/sitemap. WP-7 still owns removing it from crawlable
  surfaces (e.g. keeping it out of `sitemap.ts`).

  **Folder-name note:** Next 16 treats a literal `_`-prefixed folder
  (`app/_kitchen-sink/`) as a *private folder* and drops it from routing
  entirely — the page 404s. The URL-encoded form `app/%5Fkitchen-sink/`
  (`%5F` = `_`) is Next's sanctioned way to keep the literal `/_kitchen-sink`
  URL, so the directory is named that way.

### `.gitignore` edit (pre-authorised in the WP-2 brief)

Appended `data/` (one entry, with a comment) so local waitlist captures never
enter the tree. This is the only WP-1-lane file WP-2 touched.

### Conventions / decisions

1. **Keyframes for the Hero word-rise** live in a component-scoped `<style>`
   tag inside `Hero.tsx` (can't add to `globals.css` from this lane). JS only
   sets each word's `--w` index; the stagger is `animation-delay: calc(var(--w)
   * 50ms)` in CSS. `Hero` stays a server component.
2. **Reduced motion.** `Hero` — a `@media (prefers-reduced-motion: reduce)`
   block in its scoped `<style>` sets `animation: none; transform: none` so the
   words rest in final position. `ScrollReveal` — `motion-reduce:` utilities
   (`motion-reduce:opacity-100 motion-reduce:translate-y-0
   motion-reduce:transition-none`) force the visible, untransformed, no-transition
   resting state regardless of the in-view state. `FAQ` chevron rotation is a
   transition with `motion-reduce:transition-none`. globals.css's global
   reduced-motion rule is a second backstop for all three.
3. **`StudyCard` external link** implements the "opens in a new tab" cue WP-1's
   `LinkButton` lacks: `target="_blank"` + `rel="noopener noreferrer"` + a
   visible ` ↗` (`aria-hidden`) + a visually-hidden `(opens in a new tab)`.
   `LinkButton` was left untouched.
4. **`Hero.headline`** accepts `string | ReactNode`. A node tree is flattened to
   words; words inside `<em>`/`<i>`/`<cite>` keep the serif-italic accent AND
   animate as their own word, so the home hero can pass
   `<>… <em>person</em> …</>` and still get the per-word rise.
5. **No new dependencies.** No `lib/`, `components/ui/**`, `components/chrome/**`
   or other out-of-lane edits. No cross-lane requests outstanding.

### For the page builders (WP-3–6)

- Import blocks from `@/components/blocks/<Name>`. `PrincipleGrid` +
  `PrincipleCard` and `FAQ` + `FAQItem` are named exports from one file each
  (`PrincipleGrid.tsx`, `FAQ.tsx`).
- `Hero` renders the page `<h1>` and its own top/bottom padding
  (`py-24 sm:py-32`); drop it inside a page, not inside `Section`.
- Card blocks render an `<h3>` for their title. Wrap groups of them in a
  `Section` (which carries the `<h2>` eyebrow) to keep heading order sane.
- Card blocks do **not** impose their own grid — the page places them in a
  grid/flex container. `PhaseCard`, `StatCard` use `h-full` so an equal-height
  row works. `PrincipleGrid` is the exception: it brings its own 2-col grid.
- `WaitlistForm` props: `variant?: "inline" | "block"` (default `"block"`),
  `id?` (put `id="waitlist"` on the instance in the home closing section so the
  chrome's `/#waitlist` anchors land — WP-1 asked WP-3 for this), `className?`
  (max-width only; no other layout assumptions). On success the form element is
  replaced by a `<p role="status">` with `waitlist.success`.
- `HouseSection` takes either structured `lead` + `points: {title, body}[]` or
  free-form `children`.
- `InterfacePreview` requires `variant: "desktop" | "mobile"` and takes an
  optional `caption?: string` (a line rendered under the frame — use it to make
  `/product`'s two previews read differently). Readout mock data is baked in
  (Load 71%, Rigor 63%, Drift "holding", one Rigor receipt).
- `ScrollReveal` props: `as?` (default `"div"`), `delay?` (ms), `children`,
  `className`. It is a client component; nesting many is fine.
- `StudyCard` link text is fixed ("Read the primary source"); pass the real
  primary-source URL via `href` (see `externalLinks` in `lib/site.ts`).

---

## 2026-09-01 — Orchestrator, WP-2 gate (post-QA)

QA pass on WP-2 returned CHANGES REQUIRED. Rulings + the WP-1-lane fix I made
directly; the rest goes back to the WP-2 builder.

### RULING — signal glosses are NOT reproducible vocabulary

The one-line plain-language glosses on the live site
("how much of the thinking was yours" / "how well you reasoned when you
engaged" / "where your thinking is heading") are expressive phrasing, not terms
of art. They must be **reworded everywhere** in shipped code and sample copy.
The metric *names* (Load, Rigor, Drift) are fine — single functional words.
Approved replacement glosses (use verbatim):
- Load — "the share of the thinking you carried"
- Rigor — "the quality of your reasoning where you engaged"
- Drift — "the direction of your reasoning over time"
`PRODUCT.md` / `SPEC.md` keep the original glosses as internal description of
the real product; that is fine — those are design docs, not shipped code.

### RULING — heading order contract (Section now supports it)

I edited `components/ui/Section.tsx` (WP-1 lane) to add `title?: ReactNode`
(rendered as `<h2>`) and `titleClassName?` (pass `"sr-only"` for sections with
no visible heading). New contract for WP-3–6:
- Exactly one `<h1>` per page = the single `Hero`. Never add a page-title
  `<h1>`.
- Every `Section` that contains `<h3>`-emitting card blocks MUST pass `title`
  (visible, or `titleClassName="sr-only"` if the design shows none), so order
  is h1 → h2 → h3 with no skip.
- The earlier "wrap in Section and it carries the h2 eyebrow" guidance was
  wrong — the eyebrow is a `<p>`. Superseded by the above.

### Back to the WP-2 builder (in-lane fixes)

1. **Hero tokenizer punctuation bug** (`Hero.tsx`) — punctuation after an
   `<em>/<i>/<cite>` becomes a detached gap-separated token. The approved WP-3
   headline ("…the *person*, not just the answer.") triggers it. Fix: coalesce
   a punctuation-only token onto the preceding word (keep per-word rise + the
   accent styling on the word itself).
2. **Verbatim glosses** — apply the approved replacements in
   `InterfacePreview.tsx` (:106, :111) and the `SignalCard.tsx` doc comment
   (:12). InterfacePreview: also add a light content prop so `/product`'s two
   required previews can differ (e.g. `caption?` / `context?`), and bump
   `text-[0.68rem]` (:76) to `text-xs`.
3. **Kitchen-sink verbatim/near-verbatim copy** (`app/%5Fkitchen-sink/
   page.tsx`) — rewrite every clause QA flagged (lines ~60, 63, 85, 94, 103-04,
   117, 134, 142, 150, 158, 162, 175, 195, 217, 253, 276) FROM THE ARGUMENT,
   not by paraphrasing the source sentence. Keep only proper nouns / figures /
   principle names / study titles.
4. **Kitchen sink has two `<h1>`** — demote the page title (:45) to a `<p>`;
   the `Hero` sample is the only `<h1>`. Update the local `Group` helper to use
   the new `Section title=` prop so the kitchen sink dogfoods the real heading
   contract.
5. **Cheap a11y (in-lane, do now):** `FAQ.tsx` — wrap the `<summary>` question
   in an `<h3>` (or `role="heading" aria-level={3}`) so SR heading nav reaches
   the 8 questions on `/about`. `WaitlistForm.tsx` — on success move focus to
   the `<p role="status">` (`tabIndex={-1}` + ref focus).

### Backlogged to WP-7 (non-blocking)

- Dedupe `formatIndex` (exists in both `Section.tsx` and
  `components/blocks/shared.ts`, divergent edge behaviour).
- Letter-spacing scale: blocks use 0.22 / 0.18 / 0.16 / 0.14em ad hoc — add a
  small utility/token set or document the intended scale.
- `/_kitchen-sink` must be excluded from the deployed build (env-gate or
  route-group), not just kept out of `sitemap.ts`.
- `ScrollReveal` leaves content `opacity-0` with JS disabled + normal motion —
  don't wrap LCP/SEO-critical content solely in it (guidance for WP-3–6; WP-7
  to add a `<noscript>` unhide or IO-less fallback).
- Still open from WP-1 gate: chrome width through `Container`; `LinkButton`
  new-tab cue; `TopRibbon` first-paint CLS; confirm `metadataBase` domain.

### 2026-09-01 — WP-2 builder, gate fixes applied

All five items done, in-lane only (`components/blocks/**`,
`app/%5Fkitchen-sink/**`). Nothing else touched.

1. **Hero tokenizer** — added `coalescePunctuation()` after `tokenize()`. A
   punctuation-only token (no letters/digits, tested with `/[\p{L}\p{N}]/u`) is
   folded into the preceding word as a new `trailing` field, rendered upright
   and *outside* the `<em>`, inside the same rising mask span. Verified against
   `…the <em>person</em>, not just…` → `{text:"person",emphasis:true,
   trailing:","}` and `…the <em>output</em>.` → `{…,trailing:"."}`; plain
   strings unchanged. Rendered HTML now emits `<em>person</em>,` with no
   gap-detached glyph.
2. **Glosses / doc comment** — `InterfacePreview` Meters now use the approved
   Load/Rigor glosses; `DriftRow` carries the approved Drift descriptor plus
   the "Holding, against your 90-day baseline" state line; receipt figcaption
   `text-[0.68rem]` → `text-xs`. Added `caption?: string` prop (line under the
   frame, both variants) so `/product`'s two previews can differ.
   `SignalCard` prop doc example updated to an approved gloss.
3. **Kitchen-sink copy** — every flagged clause rewritten from the argument.
   Self-ran a 6-gram overlap check (normalise → lowercase → strip non-alnum →
   6-word windows) of the kitchen-sink page + `InterfacePreview` + `SignalCard`
   against `scratch/novarc_*.txt`: **0 shared 6-word runs** after the rewrite
   (first pass found 9; all reworded). Remaining 5-gram overlaps are all
   permitted citation strings — the study title "Generative AI and Critical
   Thinking", "Lee et al., CHI 2025", "Manu Kapur · ETH Zürich".
4. **Heading order** — page title demoted to `<p>`; `Hero` sample moved above
   the first `Section` so the single `<h1>` precedes every `<h2>`. `Group`
   helper now renders via `Section title=`. Verified rendered order: one `h1`
   (Hero) → `h2` per group → `h3` per card, no skips.
5. **a11y** — `FAQ` `<summary>` text wrapped in `<h3>` (native toggle kept).
   `WaitlistForm` focuses the success `<p role="status">` (`tabIndex={-1}`,
   ref + `useEffect` on status) so keyboard focus is not lost when the form is
   replaced.

Build / lint / `tsc --noEmit` all clean. `/api/waitlist` re-verified
(200 valid / 422 invalid / 200+no-write honeypot / 400 bad body). No
`git add`/`commit`.

### 2026-09-02 — Orchestrator, WP-3–6 wave gate

Four page-builders (WP-3 Home, WP-4 Product, WP-5 About, WP-6 Research +
`components/charts/`) merged into the working tree. Gate over the whole delta.

**Automated checks (orchestrator):** `tsc --noEmit`, `npm run lint`,
`npm run build` all clean; 7 routes prerender (`/`, `/about`, `/product`,
`/research`, `/_kitchen-sink` noindex, `/_not-found`, `/api/waitlist` dynamic).
Heading order checked on prerendered HTML — exactly one `<h1>` per page, no
skipped levels anywhere. `/api/waitlist` round-trips. Independent 5/6/7-gram
sweep of visible strings vs. `scratch/novarc_*.txt`.

**QA agent (fresh; the pre-compaction persistent QA context was unrecoverable):**
independent read of all in-scope files + own n-gram sweep + rendered-HTML
heading/anchor/chart-ARIA checks + build. Verdict: build/heading/chart/voice/
token/a11y/metadata all PASS. One systemic BLOCKING finding + a verbatim label
+ reused headings.

**Rulings & fixes applied (orchestrator, this gate):**

1. **B1 — near-verbatim paraphrase (systemic).** ~15 lines across all four
   pages kept the live site's sentence skeleton and swapped vocabulary — which
   BUILD_PLAN §0.1 bans ("re-authored from the argument, not paraphrased from a
   source sentence"). My own 6-gram check missed all of it (synonym swaps break
   n-grams); the QA eyeball pass caught it. **Ruling: re-draft each from the
   underlying claim** so clause order and cadence differ, not just the words.
   Done — research hero/sub/intro/standard/3× FindingCard/5× research-area
   gloss; home §4/§6 heading/3× SignalCard body/PhaseCard Instruments/
   "Make reasoning visible" body; product hero/"what it is"/3× SignalCard body/
   STANDARD[0]/intervene section; about HERO_SUB/ARG_PARAS/ARG_RULE/HOUSE_LEAD/
   HOUSE_POINTS bodies/OUT_INTRO/FAQ Q3,Q5,Q7.
2. **B2 — verbatim live string "No score without a receipt".** Not on the §0.1
   carve-out. **Ruling: re-author.** Label → "Every score opens to its
   evidence"; `CommitmentList` doc-comment example updated to match.
3. **B3 — section headings reproducing/rearranging live headings.** Renamed:
   "Where this goes" → "What comes after measurement"; "The house" → "Kept under
   one roof"; "Convenience has a measurable cost" → "The trade shows up in the
   data"; "Three signals" → "What it reads: Load, Rigor, Drift"; product "It
   reports what is true…" → "An honest reading, including the unflattering
   parts"; "It measures, then it intervenes" → "From a reading to a single
   prompt"; research "Five areas. One test." → "One question across five areas".
4. **NIT — status-label reuse.** Eyebrow "Launching 2026" (live recurring
   eyebrow) → "Arriving 2026" on home + product; product hero eyebrow "The
   first instrument · 2026" → "First NOVARC instrument · 2026".
5. **NIT — softer near-verbatim.** Reworked the recurring "with the system
   taken away, is the person more able/less" motif per instance; the Load/Rigor
   enumerations turned from source-mirroring colon-lists into prose; "strengthen/
   hold/erode" triplet replaced; "a faculty that goes unexercised… fades",
   Q3 "one thread… not its boundary", Q5 revenue/research pairing, "it has a
   name — cognitive outsourcing" reveal, "each held to the same", "NOVARC is an
   AI company", "the first instrument is in", "the people who use it" all
   restructured (5-gram sweep drove the last four).
6. **NIT — About FAQ Q7 dropped the LinkedIn reference SPEC §2.3 wants.** Q7
   answer converted to a node with a real `externalLinks.linkedin` anchor
   (`FaqEntry.a` is `ReactNode`; `FAQ` renders it directly). `externalLinks.
   linkedin` was defined but previously unused — now wired.
7. **NIT — RecallFailureChart y-axis read exact while bars are approximate.**
   Added an "approx." annotation above the axis (bar labels already carry "~",
   caption + `<desc>` already say direction-not-rates).
8. **`/_kitchen-sink` (dev-only, noindex):** HouseSection sample copy updated to
   match the re-authored house labels; sample lead reworded off "not a
   portfolio/spread of separate startups".
9. **`HouseSection.tsx`:** doc-comment examples updated ("One entity" / "Many
   builds" → "A single company" / "A sequence of products").

**Charts wired in.** WP-6 shipped `RecallFailureChart` / `TrustEffortChart`;
the live home "cost of convenience" section carries both. Replaced WP-3's two
`ChartSlot` placeholders with the real charts and deleted `components/home/
ChartSlot.tsx` (now dead). Both confirmed rendering on `/` and `/research`.

**Deliberate SPEC deviations (accepted, logged):**
- **About FAQ item 8.** SPEC §2.3 lists item 8 as the "Built in Zürich" close.
  Builder moved that to its own section ("Zürich-based, not Zürich-bound.") and
  made FAQ #8 a substantive question ("Against what is augmentation actually
  measured?"). All 8 SPEC topics still appear on the page. Kept — reads better
  as a section than as an accordion row.
- **Research "evidence is converging" beat** rendered as an unheaded lead
  paragraph (no `<h2>`), not a titled section. Content present; leaving it
  unheaded also sidesteps a verbatim-heading risk. Kept.
- **Numbered-section motif** (`Section index=`) is on `/about` and `/research`
  only; `/product` and `/` use word eyebrows without numbers. Consistent with
  Home. WP-7 may unify — not a blocker.

**Residual n-gram hits (all sanctioned):** the paper title "Your Brain on
ChatGPT" + "MIT Media Lab" + year; "Lee et al. · CHI 2025"; "Manu Kapur · ETH
Zürich"; the canonical outcome name "increase the rate of original discovery".
All are attributions or canonical labels — §0.1 carve-out.

Re-ran `tsc --noEmit` / `lint` / `build` after every fix — all clean. Heading
order, LinkedIn anchor, and both charts re-verified on prerendered HTML.

### WP-7 backlog additions (from this gate)
- Confirm `#waitlist` scroll offset — the home `WaitlistForm` element has no
  `scroll-mt` and sits under a sticky-ish header; check the hero CTA lands it
  correctly.
- Consider unifying the numbered-section motif across `/product` and `/`.
- `RecallFailureChart` / `TrustEffortChart` appear on both `/` and `/research`;
  if the home versions should be visually lighter (smaller, no card border),
  add a `density`/`variant` prop rather than forking.

---

## 2026-09-02 — WP-7 (polish: metadata, crawl surface, 404, favicon, a11y)

### A. Route metadata + OpenGraph

- `lib/site.ts` — added a `TODO(WP-7)` on `url` (still the live `novarc.tech`
  origin; confirm the real deploy domain before launch — no domain invented).
  Added `site.ogImage = "/og.png"`.
- `app/layout.tsx` — `openGraph.images` / `twitter.images` now point at
  `site.ogImage` (resolved to absolute via the existing `metadataBase`). Comment
  restating the domain TODO next to `metadataBase`.
- `app/page.tsx`, `app/product/page.tsx`, `app/about/page.tsx`,
  `app/research/page.tsx` — each `export const metadata` gained a full
  `openGraph` block (`type: "website"`, `siteName`, `title`, `description`,
  `url`, `images`) and a `twitter` block (`card: "summary_large_image"`, title,
  description, image), plus `alternates.canonical`. Descriptions are the
  existing per-page originals, one concern each, distinct. OG titles:
  home uses `site.title`; others use `"<Page> · NOVARC"`.
- Verified in the served HTML: per-page `og:title`/`og:description`/`og:url`/
  `og:image` (absolute), `twitter:card summary_large_image`, `<link canonical>`.

### A. OG image (static, no new dep)

- `public/og.png` — 1200×630, hand-authored SVG rasterised with the
  system `rsvg-convert` (librosvg; already installed — no npm dep, no
  sharp/Satori, no `next/og` route needed). Austere typographic layout: the
  three-bar mark, `NOVARC` wordmark, `ENGINEERING INTELLIGENCE`, and one
  hedged original line ("Tools that leave their users more capable, not less.",
  drawn from `site.identity`). Fonts resolve to DejaVu Sans/Serif via
  fontconfig. Source SVG kept in the session scratchpad, not committed.
- `public/` recreated; it now holds `og.png` (a real asset — no `.gitkeep`
  needed).

### B. Crawl / SEO surface

- `app/sitemap.ts` — lists only `/`, `/product`, `/about`, `/research`
  (absolute URLs off `site.url`). `/_kitchen-sink` and `/api/*` excluded.
- `app/robots.ts` — `userAgent: "*"`, `allow: "/"`,
  `disallow: ["/_kitchen-sink", "/api/"]`, `sitemap:
  "${site.url}/sitemap.xml"`.
- `app/_kitchen-sink` — real guard added: `if (process.env.NODE_ENV ===
  "production") notFound();` at the top of the page component (keeps the
  existing `robots: { index: false }`). In `npm run build` the route
  prerenders with `"status": 404` (`.next/server/app/_kitchen-sink.meta`) and
  `next start` serves it as the custom 404 body with a 404 code. Confirmed by
  curl. Kept the route present-but-404 rather than deleting the file so the
  block library preview still works in `npm run dev`.

### C. `app/not-found.tsx`

- New root 404, rendered inside the shared chrome automatically. One `<h1>`
  ("That page is not here."), one short original paragraph (no exclamation), a
  `LinkButton href="/"` ("Return home"). Eyebrow "404" in the section-eyebrow
  style. `metadata` sets `title: "Page not found"` + `robots: noindex`.

### D. Favicon / mark

- `app/icon.svg` — hand-authored, three ascending bars matching
  `components/chrome/Wordmark.tsx`. Embedded `<style>` switches fill between the
  light `--text` (`#1b1a16`) and dark `--text` (`#f1eee4`) via
  `@media (prefers-color-scheme: dark)` (SVG favicons honour this). Token
  values, not arbitrary.
- `app/favicon.ico` — replaced the `create-next-app` default (Next logo,
  ~25 KB) with a 16/32/48/64 multi-resolution ICO built from `icon.svg` via
  `rsvg-convert` + Pillow (`PIL`, already installed — no npm dep). ~1.8 KB.
- `app/apple-icon.png` — 180×180, dark bars on the `#faf9f5` ground, same
  rasterise path. Next emits `<link rel="apple-touch-icon" sizes="180x180">`.
- Served `<link rel="icon">` (svg + ico) and `apple-touch-icon` confirmed by
  curl.

### E. Chrome + primitives cleanup

- `components/ui/Container.tsx` — now spreads extra props
  (`...rest` typed as `Omit<ComponentPropsWithoutRef<"div">, "children">`) onto
  the rendered element, so landmarks routed through it keep their `aria-label`.
- `components/chrome/Header.tsx` — sticky bar outer `div` and the mobile-menu
  `<nav>` both routed through `<Container width="wide">` (the latter as
  `as="nav"` with its `aria-label` passing through). Removed the two
  hardcoded `max-w-[80rem]`.
- `components/chrome/TopRibbon.tsx` — inner bar routed through
  `<Container width="wide">`; hardcoded `max-w-[80rem]` removed.
- `formatIndex` deduped — canonical is `components/blocks/shared.ts` (the
  `Math.trunc(Math.abs())` guard). Deleted the local copy in
  `components/ui/Section.tsx` (now imports from `shared`) and the third local
  copy in `app/research/page.tsx` (also imports from `shared`). All existing
  call sites unchanged in behaviour for their inputs; `tsc` + build clean.
- `components/ui/Button.tsx` — `LinkButton` external branch (already
  `target="_blank" rel="noopener noreferrer"`) now also appends a
  visually-hidden `" (opens in a new tab)"` to the accessible name.
  `StudyCard` already had its own equivalent treatment for the Research study
  links, so those are unchanged.
- `components/blocks/ScrollReveal.tsx` — added a stable `nv-reveal` marker
  class. `app/layout.tsx` `<head>` now carries a `<noscript>` stylesheet
  (`dangerouslySetInnerHTML`, so React never rehydrates it into a live
  `<style>`) that forces `.nv-reveal { opacity: 1; transform: none }` when
  scripting is disabled. Reduced-motion was already covered by the block's
  `motion-reduce:*` utilities; this only closes the no-JS hole. Animation for
  the common case is untouched (verified: `opacity-0` pre-reveal state still
  present in served HTML).

### F. a11y + motion + responsive sweep

- **Heading order** (prerendered `.next/server/app/*.html`): `/` 1×h1 /
  10×h2 / 13×h3; `/about` 1 / 6 / 11; `/product` 1 / 8 / 3; `/research`
  1 / 6 / 5; `/_not-found` 1×h1. No skipped levels. `/_kitchen-sink` in the
  prod build is the 404 page (1×h1, "That page is not here.").
- **`prefers-reduced-motion`**: grepped every `transition*` / `animate*` /
  `@keyframes`. All are `transition-colors` / `transition-transform` (covered
  by the existing global `*` sweep in `globals.css`, which forces
  `transition-duration`/`animation-duration` to `.01ms`), plus `Hero`'s scoped
  `@media (prefers-reduced-motion: reduce)` off-switch, plus the
  `motion-reduce:*` utilities on `ScrollReveal` and the `FAQ` chevron. Nothing
  slips through — no `globals.css` change needed.
- **`:focus-visible`**: reviewed the global floor
  (`outline: 2px solid var(--accent); outline-offset: 2px`). The 2px offset
  places the ring on the page ground (not on the control), so it clears both
  the near-black primary button and either theme ground with adequate
  contrast. Judged sufficient; left as-is.
- **`#waitlist` offset**: `components/blocks/WaitlistForm.tsx` root (`<form>`
  and the success `<p>`) now carries `scroll-mt-24`, matching the `Section`
  value, so the hero `#waitlist` CTA doesn't land the form under the sticky
  header.
- **Responsive (code reasoning, 375 / 768 / 1024 / 1440)**: no horizontal
  overflow. All non-`max-w` fixed widths are inside `overflow-x-auto` (the two
  chart SVGs, `min-w-[520px]`/`[540px]`) or gated behind `sm:`
  (`ValidationMethods` `sm:grid-cols-[13rem_1fr]`). `InterfacePreview` mobile is
  `max-w-[19rem]` (fits 375). No tables anywhere. Header at 375 drops the
  location line + inline CTA (`hidden sm:*`) to wordmark + toggle + hamburger.
  `body` has no `overflow-x`.

### G. Verify

- `npx tsc --noEmit` — clean (exit 0).
- `npm run lint` — clean (exit 0).
- `npm run build` — clean; 11 app routes, `/_kitchen-sink` prerendered as
  `status: 404`, `robots.txt` + `sitemap.xml` + `icon.svg` + `apple-icon.png`
  emitted.
- `next start` on :3123, curled: `/` `/product` `/about` `/research` → 200;
  `/sitemap.xml` → 200 `application/xml` (4 URLs, no kitchen-sink);
  `/robots.txt` → 200 `text/plain` (correct disallows + sitemap line);
  `/favicon.ico` `/icon.svg` `/apple-icon.png` `/og.png` → 200 with the right
  content types; `/_kitchen-sink` and a random path → 404 (custom not-found
  body).

### Deferred / out of scope

- **Deploy domain** for `metadataBase` — left as the live `novarc.tech` with a
  `TODO(WP-7)` in `lib/site.ts` + `app/layout.tsx`, per the brief (no domain
  invented).
- **No `app/opengraph-image.tsx`** — the static `public/og.png` (option A in
  the brief) was producible with on-box tooling, so the `next/og` fallback was
  not needed.
- Backlog nits judged out of this package: reserving vertical space for
  `TopRibbon` first-paint CLS; the ad-hoc letter-spacing scale
  (0.22/0.18/0.16/0.14em); unifying the numbered-section motif across `/` and
  `/product`; a `density` prop for the home vs. research chart instances;
  stacking the header sub-line under the wordmark on mobile; the `Footer`
  "Explore" `<p>` → visually-hidden `<h2>`. None are blockers.

### 2026-09-02 — Orchestrator, WP-7 gate

Independent QA review: **no blocking findings.** Build/lint/tsc clean; prod
`/_kitchen-sink` → 404 (no library markup in HTML or RSC payload); `formatIndex`
dedupe verified identical for every call site's inputs; per-route OG/twitter/
canonical well-formed and descriptions original (0 n-gram hits vs. live meta);
404 inside chrome with one `<h1>`; icon hex values match `--text` in both
themes; chrome width refactor preserves the 80rem cap + gutters + nav
`aria-label`; `ScrollReveal` no-JS content is visible; `#waitlist` `scroll-mt`
correct; heading order clean on all routes; reduced-motion + focus-visible
fully covered.

**Nits fixed at the gate:**
1. **noscript `ScrollReveal` backstop missed the transform.** Tailwind v4
   compiles `translate-y-3` to the `translate:` property, not `transform:`, so
   no-JS content was visible but shifted down ~12px. Added
   `translate:none!important;scale:none!important` to the `<noscript>` `<style>`.
2. **Per-route `openGraph` dropped the structured image metadata.** The four
   routes replaced `openGraph.images` with a bare string, losing
   `og:image:width/height/alt` + `og:locale` that `layout.tsx` defined.
   Moved the structured `ogImage` object into `lib/site.ts`; every route + the
   layout now import and use it. `og:image:width/height/alt` +
   `twitter:image:*` verified present on all four routes.
3. **404 emitted two `<meta name="robots">`** (Next auto-injects one for
   `_not-found`). Dropped the explicit `robots` from `not-found.tsx` metadata —
   now exactly one.
4. **Trailing-slash mismatch:** `sitemap.xml` had `https://novarc.tech/` while
   canonical/og:url are `https://novarc.tech`. `sitemap.ts` now emits the bare
   origin for home.
5. Reworded the `/about` meta description (pre-existing, unchanged by WP-7) to
   drop a faint "NOVARC is an AI company with one conviction…" skeleton echo of
   the live meta. 0 n-gram hits either way; done for cleanliness.

**Not fixed (accepted):** prod `/_kitchen-sink`'s static 404 shell has an empty
`<body>` in raw HTML (the not-found UI is in the RSC payload only) — cosmetic,
on an internal URL that should never be hit; the security requirement (no
component-library content served, HTTP 404) is fully met. Dynamic 404s render
the full styled shell.

Re-ran tsc / lint / build after the fixes — all clean. **Phase 1 complete:**
faithful static replica of novarc.tech, original prose throughout, 4 pages +
chrome + dataviz + full SEO/a11y surface.
