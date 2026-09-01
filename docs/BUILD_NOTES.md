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
