# BRIEF — aeo-bench Study 2: the discovery-file mechanism (a site where llms.txt could actually matter)

**Pre-registration, committed before any scored run.** Study 1
measured retrieval-class aids on a small, well-linked site and found
them unread and unneeded: zero consultations of llms.txt or
sitemap.xml in 900 cells, correctness saturated in every arm. The
registered scope limit was explicit — on such a site the discovery
files have no MECHANISM to matter. Study 2 builds the site where
they do: large, weakly linked, with registered ORPHAN pages
reachable only through the discovery files (or lucky path guessing).
It also picks up the two Cloudflare claims Study 1 could not reach:
the grep-loop hazard on oversized llms.txt files, and hierarchical
llms.txt as the proposed fix.

## The fixture (Petrel & Pine, catalog era)

Deterministic, committed, fictional; served in-process; nothing
deployed. Built from `corpus/facts2.json` plus a seeded PRNG
catalog:

- **~300 pages**: the Study 1 core (policies, docs, contact,
  changelog) plus a generated catalog of ~240 products across 12
  categories (names and specs from committed word lists and a
  committed seed; regeneration is byte-identical, pinned by test),
  and 8 hand-authored PINNED products whose facts feed tasks.
- **Weak linking, by design**: the home page links only the
  category hub; category pages paginate 10 products per page with
  next-page links only; deep docs chain (parent links child, no
  index of everything). No global nav into deep sections.
- **12 registered orphan pages** (legacy support bulletins, a
  rebate-terms page, discontinued-product notices), each carrying
  unique hand-authored facts. Orphans appear in sitemap.xml and in
  every llms.txt variant but are linked from NO page. They are the
  mechanism: a fact only a discovery file can lead you to.
- The NEVER-STATE list carries over; absent-class topics appear
  nowhere, pinned by test.

## Arms (6)

- **A2-baseline** — weakly-linked site, no aids (llms.txt,
  sitemap.xml 404).
- **A2-sitemap** — + `/sitemap.xml`, robots-referenced (orphans
  included).
- **A2-llms-curated** — + a curated `/llms.txt` (~30 annotated
  links: section hubs, key docs, and every orphan).
- **A2-llms-giant** — + a `/llms.txt` listing EVERY page (300+
  lines, the grep-loop probe).
- **A2-llms-hier** — + hierarchical llms.txt (root lists per-section
  `/<section>/llms.txt` files; orphans live in the support
  section's file). Cloudflare's fix, as proposed.
- **A2-hinted** — the curated llms.txt AND sitemap both present,
  plus ONE registered sentence appended to the fetch tool's
  description: "The site may also provide machine-readable indexes
  at paths like /llms.txt or /sitemap.xml." The mechanism isolator
  (the sibling series' truecap lesson): separates "models never
  discover the files" from "the files don't help even when known."

## Harness changes (both filed from Study 1's audit)

- **Structured answer channel**: a `submit_answer` tool —
  `{ answer?: string, notOnSite?: boolean }` — ends the cell. This
  removes the empty-final-text artifact (52 gpt-oss cells in Study
  1) and closes the honest-absence-phrasing registration lesson
  mechanically: absent-class correctness is the notOnSite flag, no
  phrasing pattern list. A cell with no submit_answer call is a
  MISS, recorded distinctly as `no-submit`.
- **Fetch cap 25** (a big weakly-linked site needs legroom);
  responses truncated at 24k chars with the registered notice;
  repeat-fetch and path-guess anatomy recorded per cell (a path
  guess = fetching a never-linked, never-listed path).

Grading uses Study 1′'s corrected normalization (`gradeV2`
matchers) against the submitted answer string.

## Tasks (32, hand-authored, committed)

- **orphan (10)** — the fact lives on an orphan page. On
  A2-baseline these are solvable only by path guessing; the
  registered expectation is a near-zero baseline.
- **deep (8)** — the fact is linked but ≥3 hops down a chain
  (pagination or doc chains).
- **shallow (6)** — controls near the root.
- **absent (8)** — not on the site; correct = notOnSite.

## Models (5) and cells

The Study 1 five (gemini-3.5-flash, sonnet-4.5, opus-4.8, kimi-k3,
gpt-oss-120b). 32 tasks × 6 arms = 192 cells per model; 960 cells
full matrix.

## Pre-registered hypotheses and gates

- **S2-H1 (the mechanism, the gate):** pooled over models, paired
  per (model, task) on the ORPHAN class: at least one of
  A2-sitemap / A2-llms-curated / A2-llms-hier beats A2-baseline at
  p < .05 (exact sign test). If no discovery arm moves the one
  class engineered for them, the files fail even their best case at
  the model layer.
- **S2-H2 (discovery under pressure — registered read, not a
  gate):** unprompted consultation rate of a present discovery file,
  per model, in the non-hinted arms. Study 1 measured 0/900 on an
  easy site; the read: if consultation stays near zero even where
  navigation fails, the files' value is gated entirely on harness
  or product affordances, and the A2-hinted deltas quantify what
  one sentence of affordance buys.
- **S2-H3 (the grep-loop claim — registered read):** among cells
  that consulted the file, A2-llms-giant vs A2-llms-curated on
  input tokens and repeat fetches. Giant ≥ 1.5× curated input
  supports Cloudflare's hazard; A2-llms-hier within 1.2× curated
  supports their fix. Reported vacuous if consulting cells are too
  sparse (< 5 per arm pooled).
- **S2-H4 (no-harm, comparative — the standing protocol):** per
  model, no aid arm below A2-baseline by more than 2 tasks on the
  linked classes (shallow + deep), and absent-class false-answer
  cells ≤ baseline + 2 in every arm.
- **S2-H5 (descriptive):** path-guessing anatomy (do models try
  /llms.txt, /sitemap.xml, or guessed URLs when navigation fails —
  and does failing teach them mid-cell?), fetch counts and
  truncation hits, no-submit rate per model (the artifact check),
  hinted-arm behavior shifts, per-class and per-model tables,
  cost.
- **The study gate: S2-H1 and S2-H4.**

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Gate passes | Discovery files are measured-useful exactly where a site is weakly linked: ship guidance becomes conditional on site shape (well-linked: skip llms.txt per Study 1; weak or huge: ship it, in the variant the data favors), with H3 deciding curated vs hierarchical |
| H1 fails via zero consultation (baseline ≈ discovery arms ≈ 0 on orphans) | The files fail their best case at the model layer because nothing reads them even under pressure; the hinted-arm deltas become the story — agent products, not websites, hold the key; publish prominently |
| H1 fails with consultation present (files read but orphans still unfound) | Reading a discovery file does not translate into using it for navigation — a sharper negative than Study 1's; publish the anatomy |
| H4 fails | An aid measurably hurts on a hard site (e.g. giant llms.txt drowns navigation); that variant is anti-recommended with its anatomy |
| Fixture defect mid-run | Stop, fix, re-register, restart scored runs from zero |

## Cost fences

- **Pilot (authorized 2026-07-30 "yes, proceed with study 2"):**
  gemini-3.5-flash × 6 arms × 32 tasks = 192 cells ≈ **$3–8**
  (larger pages, up to 25 fetches). Runs after this brief and the
  fixture/harness/grader tests are committed.
- **Full matrix:** +4 models = 768 further cells ≈ **$60–140**.
  Requires Kevin's explicit go-ahead after pilot results are
  published. AUTHORIZED 2026-07-30 ("Yes proceed with full matrix")
  with pilot results committed in results/analysis-study2-pilot.txt.

## Disclosure

Unchanged from Study 1: the analyst model (fable-5) is not among
the measured models; graders are mechanical and committed before
any scored run.
