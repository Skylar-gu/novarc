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
- `InterfacePreview` requires `variant: "desktop" | "mobile"`; all mock data is
  baked in (Load 71%, Rigor 63%, Drift "holding", one receipt). No props for
  the content.
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
