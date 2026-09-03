# SPEC — What is being built

**Scope of this document:** a precise reconstruction of what [novarc.tech](https://novarc.tech/)
is, section by section, so it can be rebuilt and then extended. Part 1 is the company
and its message architecture. Part 2 is the website as an artifact (pages, components,
design system, stack). Part 3 is the product. Part 4 is the build plan.

Source of truth: the live site as of 2026-09-01 — home, `/product`, `/about`,
`/research`. Product mechanics live in [`PRODUCT.md`](PRODUCT.md); the forward-looking
thesis lives in [`VISION.md`](VISION.md).

---

## Part 1 — The company

### 1.1 One-line identity

> An AI company with one conviction: **augmentation, not replacement.** Technology
> that makes people more capable — never obsolete.

- **Name:** NOVARC. Descriptor line used in footer: "Engineering intelligence."
- **HQ / founded:** Zürich · 2026.
- **Founder:** Pavel Abdulin.
- **Nature:** both a commercial company and a research organization — "the commercial
  work funds the research; the research informs the product decisions."

### 1.2 The core claim, stated three ways

| Register | The line |
|----------|----------|
| Headline | "AI that *augments*, not replaces." |
| Mission | "AI should leave you sharper than it found you." |
| Ship rule | "If a technology leaves people less capable than it found them, it does not ship." |

### 1.3 The argument (why the company exists)

1. Most AI is optimized for **convenience**: the system does more so the person does
   less. "Convenience is the industry default. Capability is ours."
2. Done for years across millions of users, that is **cognitive outsourcing**.
3. Unused ability does not hold steady — it declines. (Backed by the research in §Part 3
   and [`PRODUCT.md`](PRODUCT.md).)
4. Therefore NOVARC engineers "the opposite trade": every model, agent, and tool is
   judged by *what its user becomes able to do*, not by what the system produces.
5. But you cannot manage what you cannot measure — and "nobody can tell you what AI is
   doing to your thinking … because the instrument doesn't exist yet." So the first
   product is that instrument.

### 1.4 Four principles ("held everywhere")

1. **Augment, never replace** — every system must leave its user more capable when it
   is removed, never more dependent.
2. **Judgment stays human** — agents can carry the work; deciding what matters is never
   delegated.
3. **Make reasoning visible** — if a process can't be inspected, it can't be trusted;
   expose the steps, not just the verdict.
4. **Measure capability, not engagement** — success is what a person can do after using
   the system, not time spent inside it.

### 1.5 Six outcomes every product is judged against

Strengthen reasoning ability · increase learning speed · improve memory formation ·
enhance structured thinking · enable deeper problem-solving · increase the rate of
original discovery.

### 1.6 Company structure — "One house. Many builds."

- One legal entity, one brand, many products over time — explicitly *not* a portfolio
  of separate startups.
- Rationale: compounding. "The research compounds, the craft compounds, the trust
  compounds." Each build makes the next more credible than starting fresh would.

### 1.7 Product line / roadmap (three phases, sequential)

| # | Phase | State on site | One-liner |
|---|-------|---------------|-----------|
| 01 | **Instruments** | in validation, launching 2026, unnamed until launch | Measurement first, "because the rest depends on it." |
| 02 | **Models** | not built yet | Reasoning-first models, evaluated for how well they *extend* users rather than replace them. |
| 03 | **Agents** | "a direction we intend to earn" | Agentic systems that absorb busywork, surface decisions, keep judgment human. |

### 1.8 Research program (five areas, one standard)

Measurement · cognitive augmentation · human–AI interfaces · reasoning & model
behavior · agentic systems. Standard applied to all: *does this leave the person more
capable?* — "the standard we already apply to medicine, education, and physical
training."

---

## Part 2 — The website as an artifact

### 2.1 Sitemap

```
/            Home        — full argument in one scroll; every section is a teaser for a subpage
/product     Product     — the first instrument: what it is, the three signals, the standard, validation
/about       About       — the conviction, "one house", six outcomes, founder Q&A
/research    Research     — the evidence base: two anchor studies + three cognitive-science findings
             Waitlist    — "Join the waitlist" / "Get updates" (email capture; primary and only CTA)
```

Persistent chrome:
- **Top ribbon:** "The first NOVARC instrument launches 2026 · Join the waitlist".
- **Header nav:** Home · Product · About · Research · *Get updates*. Left: NOVARC mark
  + "Zürich · Founded 2026".
- **Footer:** the identity line, "Headquartered in Zürich · Founded 2026", an *Explore*
  column (Product, About, Research, Waitlist), "© 2026 NOVARC — Engineering
  intelligence".

### 2.2 Home page — section order and intent

| # | Section | Job | Links to |
|---|---------|-----|----------|
| 1 | Hero | Headline "AI that *augments*, not replaces." + sub "We build AI — models, agents, and tools — designed to make people more capable, never obsolete." Word-by-word rise-in animation on the headline; `Get updates` + `Join the waitlist →`. | Waitlist |
| 2 | Principle 01 teaser | "Augment, never replace" as a standalone statement. | /about |
| 3 | First instrument teaser | "Launching 2026 · The first NOVARC instrument". | /product |
| 4 | Convenience vs. capability | The §1.3 argument, condensed. | — |
| 5 | The instrument, explained | "Daily AI use becomes three signals." + interface preview image. | /product |
| 6 | Three signals | Load / Rigor / Drift, one paragraph each (see [`PRODUCT.md`](PRODUCT.md) §2). | /product |
| 7 | "Where this goes" | The three-phase roadmap (§1.7). | /product |
| 8 | Four principles | §1.4, numbered 01–04. | — |
| 9 | "The cost of convenience is measurable" | Research stat cards + two small charts (see §2.5). | /research |
| 10 | "The house" | "One company. Every build." (§1.6). | /about |
| 11 | Closing | "AI should leave you sharper than it found you" + waitlist. | Waitlist |

### 2.3 `/product`, `/about`, `/research` — section maps

**/product:** hero ("Nobody can tell you what AI is doing to your thinking …") → "What
it is" → interface preview → "Three signals" (Load/Rigor/Drift, full text) → "The
standard" ("It reports the truth, including when the truth is unwelcome" — most sessions
unscored; "No score without a receipt") → second interface preview → "Measurement, then
intervention" → "In validation. Launching 2026." (four validation methods; results
published regardless of outcome) → footer CTA.

**/about:** hero (the conviction) → "Technology that leaves people more capable"
(cognitive-outsourcing argument + the ship rule) → "One house. Many builds." with three
cards: *One entity* / *Many builds* / *Compounding* → "Six outcomes we hold our products
to" (§1.5, numbered) → "Questions, answered" — 8-item FAQ:
1. Who founded NOVARC and why (Pavel Abdulin; the founding observation).
2. How NOVARC differs (orientation = increasing *user* capability, not system
   capability).
3. What NOVARC actually builds (models, agents, products under one conviction;
   cognitive augmentation is "one thread, not its boundary").
4. When the first product ships (validation now; launches 2026; unnamed; access +
   pricing announced ahead of launch, waitlist first).
5. Research org or commercial company (both).
6. University affiliation (independent; engages with published work from MIT, CMU,
   ETH Zürich).
7. How to follow progress (LinkedIn; waitlist first).
8. (closing) "Built in Zürich. Built for the world."
→ footer CTA.

**/research:** hero ("AI built for convenience erodes the *capability* it replaces …
that is not a slogan. It is what the studies now show.") → "The evidence is converging"
→ **two anchor studies** as detailed cards:
- *Your Brain on ChatGPT* — MIT Media Lab, Kosmyna et al., 2025. Reduced neural
  connectivity, weaker memory of one's own work, diminished sense of authorship. Pull
  quote: "Cognitive debt — capability lost in exchange for short-term efficiency."
  Link → media.mit.edu/projects/your-brain-on-chatgpt/overview/
- *Generative AI and Critical Thinking* — Microsoft × Carnegie Mellon, Lee et al., 2025
  (CHI 2025). Higher confidence in AI ↔ less critical thinking; higher self-confidence
  ↔ more. Pull quote: "The more people trust the system, the less they exercise the
  faculties it is meant to support." Link → microsoft.com research publication.
→ "Any system that interfaces with human cognition should be able to demonstrate that
it strengthens the faculties it engages" → **three cognitive-science findings**:
1. The brain learns through **prediction error** — Wolfram Schultz, Cambridge, The
   Brain Prize 2017. Instant answers close the prediction gap → no surprise, no
   learning.
2. **Productive failure** beats direct instruction — Manu Kapur, ETH Zürich. Tools that
   hand over finished answers remove the struggle understanding is built from.
3. **Calibration is trainable, and most people lack it** — Schraw · Dunlosky · Bjork.
   "AI that always agrees produces confidence without competence."
→ "Five areas. One conviction." (§1.8) → closing CTA.

### 2.4 Component inventory

- `TopRibbon` — dismissible announcement bar.
- `Header` / `Nav` — logo lockup + 4 links + updates button; theme toggle.
- `Hero` — masked word-rise headline animation (`.word-mask` / `.word-rise` with
  `--w` stagger index), accent `<em class="accent-word">` on one word.
- `PrincipleStatement` — oversized numbered statement (`01 · Principle`).
- `SignalCard` — number, name, plain-language gloss ("how much of the thinking was
  yours"), body paragraph. Used 3× on home and /product.
- `PhaseCard` — roadmap item (01 Instruments / 02 Models / 03 Agents) with state note.
- `PrincipleGrid` — 2×2 of the four principles.
- `StatCard` — a single research finding + source attribution (e.g. "MIT Media Lab ·
  2025"). ~6 on home.
- `ChartBlock` — two small figures on home / research: "Couldn't quote their own essay
  minutes later — % by group" (bar, EEG study, n=54) and "Higher confidence in AI ↘
  less critical thinking" (relationship plot, Lee et al. CHI 2025). See
  [dataviz skill] when implementing.
- `StudyCard` — full citation, finding, pull quote, external link (research page).
- `FindingCard` — cognitive-science finding + researcher attribution.
- `InterfacePreview` — device-framed product screenshot, mobile + desktop variants.
- `FAQ` — accordion, 8 items on /about.
- `WaitlistForm` — email input + submit; appears in hero, mid-page, footer, ribbon.
- `Footer` — identity line + Explore column + copyright.
- `HouseSection` — "One company. Every build." band.

### 2.5 Design system

Observed from the live build; fill gaps deliberately, don't guess silently.

- **Stack:** Next.js (App Router, Turbopack), self-hosted `.woff2` fonts, static PNG
  assets (`/novarc-mark.png`, `/icon.png`, `/apple-icon.png`). No visible analytics
  wall. Deploy target unknown — assume Vercel.
- **Ground color:** `#faf9f5` — warm off-white (the only hex in the served HTML). Dark
  theme exists (toggle in header); define the dark palette explicitly rather than
  inverting.
- **Typography:** four font faces preloaded. A serif with true italics is used for
  accent words ("*augments,*", "*capability*") and pull quotes; a grotesque/sans for
  everything else. Strong size hierarchy, generous line-height, lots of whitespace.
  Identify exact families before implementing (inspect the woff2 or licence them; do
  not ship unlicensed fonts).
- **Layout:** single-column, wide margins, long vertical rhythm; each home section is
  self-contained and leads somewhere. Numbered sections (`01`, `02`, …) are a recurring
  motif.
- **Motion:** headline word-rise on load; assume gentle fade/translate on scroll for
  sections. Keep it restrained — the brand reads as "instrument", not "landing page".
- **Voice:** declarative, austere, a little severe. Short sentences. No exclamation, no
  emoji, minimal adjectives. Claims are hedged precisely ("Scored only where the
  conversation offered the opportunity").
- **Imagery:** the geometric NOVARC mark; product-UI previews; the two data figures.
  No stock photography, no faces.
- **Accessibility / theming:** must satisfy the artifact/theming rules if any of this
  is later published as an Artifact — palette as tokens on `:root`, dark overrides
  guarded, explicit `body` background.

### 2.6 What the replica must reproduce vs. re-author

| Reproduce (structure/behavior) | Re-author before any public deploy (text/identity) |
|---|---|
| Sitemap, section order, component set | All body copy — original wording, same argument |
| Design system, motion, voice register | Company name / founder / location if this becomes its own thing |
| The three-signal product model | Study summaries — cite primary sources directly, write our own gloss |
| Waitlist-first funnel | The mark / logo / fonts (licence or commission) |

---

## Part 3 — The product

Full mechanics in [`PRODUCT.md`](PRODUCT.md). In brief: an instrument that sits inside
ChatGPT / Claude / Gemini, reads the *user's* side of the conversation, and turns daily
use into three signals — **Load** (how much of the thinking was yours), **Rigor** (how
well you reasoned when you engaged), **Drift** (where your thinking is heading, vs. your
own baseline). Standards: most sessions go unscored; every score ships with the exact
quoted passages that produced it ("no score without a receipt"); it also returns one
targeted prompt per detected gap, and excludes coached behavior from trend math.
Currently in a validation program (human-agreement, adversarial, stability,
longitudinal); results to be published regardless of outcome.

---

## Part 4 — Build plan

### Phase 0 — Repo + spec *(this commit)*
`git init`; `SPEC.md`, `PRODUCT.md`, `VISION.md`.

### Phase 1 — Static replica of the site
- Next.js App Router project; `#faf9f5` ground + dark theme tokens; font faces resolved.
- All four routes with the section maps in §2.2–2.3, using the §2.4 components.
- Placeholder original copy that carries the same argument (no verbatim site text).
- Working `WaitlistForm` (store to a table or a form service; double opt-in).
- The two data figures rebuilt from the primary studies (per the dataviz skill).
- Lighthouse / a11y / theme-parity pass.

### Phase 2 — Make it real (the "more magical" turn — see [`VISION.md`](VISION.md))
- [x] Instrument prototype: transcript in → {Load, Rigor, Drift, receipts, one prompt}.
      Live at `/instrument`; details in [`INSTRUMENT_PROTOTYPE.md`](INSTRUMENT_PROTOTYPE.md).
- [x] Scoring engine v0 with an explicit rubric; abstain by default. Two engines:
      a deterministic heuristic pass (always on) and an optional LLM judge; the
      output contract and the span-validation step are shared.
- [x] "Receipt" viewer: every score expands to the quoted passages behind it.
- [x] Personal baseline + drift chart over time — client-side, `novarc:instrument:v1`.
- [x] Import flow for ChatGPT/Claude/Gemini transcripts (paste or file upload,
      format auto-detected). A browser extension is deferred; the import flow
      covers ingest for the prototype.

### Phase 3 — Validation harness
- Human-agreement set (inter-rater + model-vs-human).
- Adversarial set (fluent-but-empty reasoning must not score well).
- Stability set (same transcript, repeated scoring).
- Longitudinal calibration against self-baselines.
- Publish the methodology and the numbers, good or bad.

### Open questions
- Exact font families and licences.
- Where waitlist submissions should land.
- Whether we keep the NOVARC name or fork identity once Phase 2 diverges. *(Stands.)*
- ~~Privacy model for reading real transcripts (local-first vs. server scoring).~~
  Resolved for the prototype: local-first. The transcript is POSTed once to
  `/api/instrument/score`, scored, and not persisted server-side; the capability
  record lives only in the browser under `novarc:instrument:v1` and is
  exportable, importable, and deletable by the user. Revisit before any
  server-side history or multi-device sync.
- What the instrument does when it disagrees with the user's self-assessment.
