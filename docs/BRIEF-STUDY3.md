# BRIEF — aeo-bench Study 3: the affordance study (how should an agent harness consume a site index?)

**Pre-registration, committed before any scored run.** Study 2
proved the discovery layer's value is real and its consumption is
the missing link: one sentence of tool-description affordance took
the orphan class from 0/10 to 8–10/10. But that sentence was a
single point in an unmapped design space, and a real harness
decision now rides on the map: Lightning Jar's prospective
lj-website chat agent (candidate model Haiku 4.5, per
BRIEF-HAIKU). Study 3 measures the affordance designs available to
an agent builder, on the frozen Study 2 fixture.

**Registered prediction, stated before running:** prefetching the
index into context beats hinting the model to fetch it. This is
the sibling series' oldest lesson (app-side carriers beat model
initiative: hand it everything it needs) ported to this domain. A
refutation would be a real result: it would mean discovery is
better left to model initiative once afforded, contradicting the
carrier thesis in this task family.

## Arms (5) — fixture and tasks frozen from Study 2

The site is Study 2's catalog-era fixture, unchanged. Tasks are
`corpus/tasks2.json`, unchanged. Two arms are REUSED from frozen
Study 2 records rather than re-run (byte-identical conditions,
registered):

- **A3-control** — REUSE: Study 2's `A2-llms-curated` cells (the
  curated-index site, no affordance; orphans 0/10 everywhere).
- **A3-hint** — REUSE: Study 2's `A2-hinted` cells (the registered
  sentence; site also served sitemap.xml — a disclosed config
  difference carried with the reuse; no model's unprompted
  behavior touched the sitemap in any Study 2 arm).

Three arms run fresh (site config: the curated-index site;
prefetch-giant uses the giant-index site):

- **A3-prefetch** — the harness fetches `/llms.txt` (curated)
  itself and injects it into the system prompt before the first
  turn, under a registered header: "Site index (served by the site
  at /llms.txt):". No behavioral instruction. The carrier arm.
- **A3-prefetch-giant** — identical, but the giant everything-index
  (~300 entries; the shape of lj-website's real ~150-entry
  llms.txt). Powers the grep-loop/size read that went vacuous
  twice: with prefetch, consultation is 100% by construction.
- **A3-tool** — a `read_site_index` tool ("Returns the site's
  machine-readable index of pages") alongside fetch; description
  otherwise neutral. Tool-shaped affordance vs prose-shaped.

## Models (3) and cells

`anthropic/claude-haiku-4.5` (the candidate — this study is its
harness design document), `anthropic/claude-opus-4.8` and
`google/gemini-3.5-flash` as anchors. Fresh cells: 32 tasks × 3
arms × 3 models = **288**; reused cells: 192 (from frozen Study 2
records for these models).

## Pre-registered hypotheses and gates

Definitions (orphan/linked/absent classes, correctness, no-submit)
byte-identical to BRIEF-STUDY2.

- **S3-H1 (candidate readiness — the gate):** on Haiku 4.5,
  A3-prefetch scores ≥ 9/10 on the orphan class AND ≥ its own
  A3-control on linked classes AND absent-class ≥ 6/8 AND
  no-submit = 0. The harness design the agent would actually ship
  must hold the candidate's Study 2 quality.
- **S3-H2 (the carrier prediction — the gate):** pooled over the
  three models, paired per (model, task) on the orphan class:
  A3-prefetch is non-inferior to A3-hint (wins + ties ≥ losses − 2)
  AND uses fewer mean fetches per cell. Refutation reading
  registered above.
- **S3-H3 (the size read — registered read, finally powered):**
  A3-prefetch-giant vs A3-prefetch: orphan and linked correctness
  within 2 tasks pooled, input-token ratio reported. Giant ≥ 1.3×
  curated input supports serve-the-agent-a-curated-slice guidance
  for large sites; parity supports serving the full index.
- **S3-H4 (comparative no-harm — standing protocol):** no fresh arm
  below A3-control by more than 2 tasks on linked classes per
  model; absent-class false answers ≤ control + 2.
- **S3-H5 (descriptive):** tool-arm call patterns (does the model
  call read_site_index unprompted, when, how often), tokens per
  solved task per arm (the harness economics table), fetch counts,
  orphan time-to-first-orphan-fetch, absent discipline per arm.
- **The study gate: S3-H1, S3-H2, S3-H4.**

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Gate passes | The lj-website agent ships prefetch: index in context, no reliance on model initiative; H3 picks curated-slice vs full-index; the hint remains the fallback for harnesses that cannot prefetch; blog sequel: "how to actually wire it" |
| H1 fails | The candidate cannot hold quality under the shipping design — re-examine before building on Haiku, or test the next design point on it |
| H2 fails (hint beats prefetch beyond margin) | Model initiative beats the carrier in this family — the carrier thesis has a measured boundary; ship the hint, publish the refutation prominently |
| H2 fails via fetch count only (accuracy ties, prefetch not cheaper) | Economics decide: report the cost table and let the product pick; no strong design claim ships |
| H4 fails | An affordance design harms (e.g. giant index drowns linked-class navigation) — anti-recommend that design with its anatomy |

## Cost fence

288 fresh cells (Study 2 weight, minus the hinted arm's savings
pattern). Projected **$25–45**, opus-dominated. Authorized
2026-07-30 ("proceed" on the Study 3 recommendation). Single
phase — the reused arms serve as the pilot's sanity anchor.

## Disclosure

Unchanged: mechanical graders committed before any scored run; the
analyst model is not among the measured models.
