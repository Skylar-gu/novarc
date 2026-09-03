# NOVARC (working replica + evolution)

An AI company built on one conviction: **augmentation, not replacement.** Technology
that leaves the people who use it *more* capable — sharper reasoning, faster learning,
more complexity held in mind — never more dependent.

This repository starts as a faithful replica of [novarc.tech](https://novarc.tech/)
(a real company founded by Pavel Abdulin, Zürich, 2026) and is the base from which we
build something more ambitious: a concrete instrument for **human–AI coevolution**,
where AI measurably builds human intelligence rather than quietly renting it back to us.

## Why this exists

The dominant trajectory in AI is *delegation* — systems that think so you don't have
to. Repeated across years and millions of users, that trade has a name: **cognitive
outsourcing**, and the early evidence (MIT Media Lab 2025; Microsoft × CMU 2025) says
the capability you stop using does not hold steady — it declines.

NOVARC engineers the opposite trade. The first product is a **measurement instrument**
for human cognition under AI assistance: it runs inside the tools people already use
(ChatGPT, Claude, Gemini) and reads not what the model produced, but *how the person
reasoned while producing it*. Daily AI use becomes three signals — **Load, Rigor,
Drift**.

## Documents

| File | What it covers |
|------|----------------|
| [`docs/SPEC.md`](docs/SPEC.md) | Exactly what is being built: the marketing site (page-by-page, message architecture, design system, components), the company model, and the build phases. |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | The NOVARC Instrument in detail — the three signals, the evidence standard ("no score without a receipt"), intervention, and the validation program. |
| [`docs/VISION.md`](docs/VISION.md) | The larger thesis this connects to: human–AI coevolution, where the instrument goes next, and what "more magical" concretely means. |
| [`docs/INSTRUMENT_PROTOTYPE.md`](docs/INSTRUMENT_PROTOTYPE.md) | What Phase 2 built: the `/instrument` prototype — architecture, the two scoring engines, rubric summaries, the privacy decision, and how to enable the language-model judge. |

## Status

- [x] `git init`
- [x] Spec + vision drafted
- [x] Site scaffold (Next.js, design system, theme, page chrome) — WP-1
- [x] Shared component library + waitlist API — WP-2
- [x] All four pages built (Home, Product, About, Research) + dataviz — WP-3–6
- [x] Polish pass (per-route metadata/OG, sitemap/robots, 404, favicon, a11y sweep) — WP-7
- [x] **Phase 1 complete — faithful static replica of novarc.tech, original prose throughout**
- [ ] Phase 2: the "more magical" turn (see `docs/VISION.md`) — in progress
- [x] Instrument prototype — live at `/instrument` (a **prototype**, not the validated
  instrument). Paste one ChatGPT / Claude / Gemini transcript and it reads your half of
  it: Load, Rigor, and the passages from your own messages behind each score, with most
  sessions left unscored. A deterministic rubric engine runs by default; set
  `ANTHROPIC_API_KEY` (and optionally `INSTRUMENT_MODEL`, default `claude-opus-5`) to
  enable the language-model judge. See `docs/INSTRUMENT_PROTOTYPE.md`.
- [ ] Validation harness

## Attribution

novarc.tech is an existing company. This repo replicates its public site as a study
and a starting point, with the site owner's concept credited throughout. All shipped
marketing copy in this repo should be rewritten as original text before any public
deployment — both because we are going somewhere different, and to keep the replica a
scaffold rather than a copy.
