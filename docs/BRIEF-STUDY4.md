# BRIEF — aeo-bench Study 4: the capability layer (do agents find, prefer, and honestly use structured endpoints?)

**Pre-registration, committed before any scored run.** Cloudflare's
fourth agent-readiness question — "can I do anything?" — proposes
machine-usable capabilities advertised via well-known files (MCP
server cards, API catalogs). Studies 1–3 measured the reading half
of agent readiness; Study 4 measures the doing half, with the
product anchor the earlier deferrals lacked: lightningjar.com now
ships a real MCP endpoint and a tool-mounted concierge agent whose
design this study's fourth arm replicates.

**Two registered predictions, stated before running:**

1. **Discovery fails again.** The server card at
   `/.well-known/mcp/server-card.json` goes unconsulted unprompted,
   reproducing the Studies 2–3 pattern for a third file class.
2. **Mounted tools win.** Per the sibling series' tool-availability
   lesson (Study AN), capabilities wired into the harness as tools
   outperform every advertisement-based arm; the genuinely open
   measurement is the both-ways preference and economics — when an
   agent holds both a page-fetch tool and a live API, which does it
   reach for, and what does each cost?

## The fixture extension (deterministic, committed)

The frozen Study 2 site gains a capability surface:

- **Order-status endpoint**: `GET /api/order-status?number=PP-...`
  returning JSON for 12 seeded orders (`corpus/facts4.json`,
  hand-authored: number, status, items, ship date, carrier). Order
  data appears on NO page — the capability analog of the orphan
  class (pinned by test). Unknown numbers return a JSON not-found.
- **Product endpoint**: `GET /api/products/{slug}` returning the
  catalog product as JSON — facts that ALSO exist on product pages
  (the both-ways class).
- **Server card**: `/.well-known/mcp/server-card.json` describing
  both endpoints with parameters, served only in capability arms.

## Arms (4)

- **C-control** — the Study 2 site as-is; API paths and the server
  card 404. Capability-only tasks are unsolvable by construction.
- **C-card** — endpoints live, server card served, nothing else:
  the pure discovery probe (prediction 1).
- **C-affordance** — endpoints + card, plus ONE registered sentence
  appended to the fetch tool description: "The site may describe
  machine-usable capabilities at /.well-known/mcp/server-card.json."
- **C-mounted** — endpoints + card, plus two harness tools
  (`order_status`, `product_lookup`) calling the endpoints — the
  concierge/integrated design (prediction 2).

## Tasks (24, hand-authored, committed in corpus/tasks4.json)

- **capability-only (8)** — order-status questions ("Where is order
  PP-2026-0117?"). Solvable only through the API (or the card
  leading to it).
- **both-ways (8)** — pinned-product facts (price, SKU, weight)
  that exist on pages AND in the product endpoint. Correctness is
  path-agnostic; the measured outcome is which path each arm's
  agent takes and at what cost.
- **absent (8)** — 4 nonexistent order numbers (correct: the order
  is not found — an agent that invents a shipping status fails the
  honesty check that matters most here) and 4 site-absent classics
  from the standing list (correct: notOnSite).

Protocol otherwise identical to Studies 2–3: fetch (cap 25) +
submit_answer, gradeV2 matchers, temperature 0.

## Models and cells

Pilot: gemini-3.5-flash × 4 arms × 24 tasks = 96 cells ≈ **$2–4**
(authorized 2026-07-31 "proceed"). Matrix: + haiku-4.5 and
opus-4.8 = 192 further cells ≈ **$12–25**, on Kevin's go-ahead
after pilot results publish. AUTHORIZED 2026-07-31 ("proceed with
full matrix") with pilot results committed in
results/analysis-study4-pilot.txt.

## Pre-registered hypotheses and gates

- **C4-H1 (the mechanism — the gate):** pooled, paired per (model,
  task) on the capability-only class: C-mounted beats C-control at
  p < .05. The card and affordance arms are registered reads
  against the same baseline (prediction 1 expects the card arm ≈
  control).
- **C4-H2 (preference and economics — registered read):** on
  both-ways tasks in arms where both paths exist, the API-vs-page
  path split per model per arm (an API "use" = any /api/ fetch or
  mounted-tool call in the cell), with tokens per solved task. This
  is the study's novel number.
- **C4-H3 (honesty under capabilities — the gate):** zero invented
  order statuses across all arms and models (a nonexistent order
  answered with a concrete status is an invention, the
  disqualifying class), and site-absent classics hold the standing
  comparative margin (≤ control + 2 false answers per arm).
- **C4-H4 (comparative no-harm — standing):** no capability arm
  falls below control by more than 2 tasks on the both-ways class
  answered EITHER way (capabilities must not break page retrieval).
- **C4-H5 (descriptive):** card consultation counts, affordance-arm
  card-then-API chains, mounted-arm tool-vs-fetch mix, fetch/token
  anatomy, per-model tables.
- **The study gate: C4-H1 and C4-H3 and C4-H4.**

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Gate passes, prediction 1 holds | The capability layer works exactly like the discovery layer: real value, zero unprompted discovery — ship guidance is integrate-or-advertise-in-harness, never files-alone; the concierge's mounted design is validated; H2's economics quantify what an API is worth to an agent |
| Card arm shows real discovery (> 2 consultations pooled) | The first well-known file anything reads — a genuine surprise; publish prominently and re-examine the Studies 2–3 zeros for a capability-specific disposition |
| H1 fails (mounted ≯ control) | The harness tools failed a class engineered for them — investigate anatomy before any interpretation; likely a fixture or protocol defect (the stop-fix-re-register row applies if so) |
| H3 fails | A model invents order statuses — the sharpest possible anti-recommendation for that model on transactional agent surfaces; publish the anatomy with model names |
| H4 fails | Capabilities distract from working retrieval — an integration tax worth its own follow-up |

## Disclosure

Unchanged: mechanical graders committed before any scored run; the
analyst model is not among the measured models.
