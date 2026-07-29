# BRIEF — aeo-bench Study 1: do retrieval-class agent-readiness techniques measurably help?

**Pre-registration, committed before any scored run.** Cloudflare's
"agent readiness" post (blog.cloudflare.com/agent-readiness) proposes
a menu of techniques for making websites legible to AI agents and
carries three quantitative claims: markdown content negotiation saves
"up to 80%" of tokens; agents "grep-loop" on oversized `llms.txt`
files; and (as of February 2026) only three agent products default to
sending `Accept: text/markdown`. None of this is measured at the
MODEL level with controlled content. Study 1 measures the
retrieval-class techniques — the ones that claim to help an agent
FIND and READ information — with the sibling repo's discipline:
seeded fixture, registered arms, mechanical grading, paired stats,
token cost as a first-class outcome.

Out of scope for Study 1, deliberately: the capability-class
techniques (MCP server cards, agent-skills indexes, Web Bot Auth,
OAuth discovery, x402). Those change what an agent can DO, not what
it can find, and get their own registration later.

## The fixture (committed, deterministic, fictional)

**Petrel & Pine Supply Co.** — a fictional outdoor-gear retailer that
exists only as `corpus/facts.json` (hand-authored, committed) and the
pages `src/site/generate.ts` deterministically renders from it:
16 product pages (name, price, SKU, weight, materials, care), 12
documentation pages (warranty terms, repair program, sizing tables,
API-of-the-store docs for wholesale), 8 info/policy pages (returns,
shipping, contacts, hours, press), a changelog, and a home page —
≈ 40 pages. Every page carries realistic boilerplate (nav, footer,
promotional copy, cookie-banner text) so markdown savings are
measurable against genuine noise. The server is an in-process
`Bun.serve` fixture on localhost; agents reach it ONLY through the
harness's fetch tool. Nothing is deployed.

## Arms (5) — site variants, baseline shared

- **A-baseline** — plain HTML site. No aids of any kind. 404s for
  llms.txt, sitemap.xml, and .md paths; no content negotiation.
- **A-llmstxt** — baseline + a single well-formed `/llms.txt`
  (site description + annotated link list, per the llmstxt.org
  shape Cloudflare endorses).
- **A-sitemap** — baseline + `/sitemap.xml` listing every path,
  referenced from `/robots.txt`.
- **A-markdown** — baseline + markdown everywhere: `Accept:
  text/markdown` returns a clean markdown rendering of any page,
  `.md` URL fallbacks exist for every path, and each HTML page
  carries the article's hidden-comment directive advertising them.
- **A-stacked** — all of the above at once (the "agent-ready" site).

One further registered manipulation inside the fetch tool, crossed
with nothing: the tool's description says only that `headers` may be
supplied — it never mentions markdown or Accept. Whether a model
sends `Accept: text/markdown` or requests a `.md` path UNPROMPTED in
A-markdown/A-stacked is a measured outcome (the Cloudflare
only-three-agents claim, at the model level), not an instruction.

## Tasks (36, hand-authored against the fact corpus, committed)

Four registered classes:

- **shallow (12)** — the fact is on an obvious page one hop from
  home (a product's price, the returns window).
- **deep (8)** — the fact lives ≥2 hops down documentation (a
  warranty exclusion, a wholesale API rate limit).
- **cross-page (8)** — the answer requires combining two pages
  (cheapest tent's care instructions; whether the repair program
  covers the product a named task references).
- **absent (8)** — the site genuinely does not carry the fact; the
  correct answer is the registered NOT-ON-SITE sentinel. The prompt
  gives the hatch verbatim: reply `NOT-ON-SITE` when the site does
  not state the answer. (The sibling repo's ask-versus-guess lesson,
  ported: fabricated policies are worse than misses.)

Agent loop: system prompt registered in the runner; the model gets
the question, the site's root URL, and a `fetch(url, headers?)` tool
(≤ 12 calls per cell, responses truncated at 24k chars with a
registered truncation notice). Temperature 0. Final answer is free
text; grading is mechanical: registered per-task matchers
(normalized substring / number-with-unit / sentinel), unit-tested.

## Models (5)

gemini-3.5-flash, sonnet-4.5, opus-4.8, kimi-k3, gpt-oss-120b — the
sibling repo's trio plus its open-weight backfill pair.

## Pre-registered hypotheses and gates

Per cell: `correct` (mechanical), `tokensIn/Out`, `fetches`,
`sentMarkdownSignal` (Accept header or .md path requested).

- **H1 (do the aids help at all?):** pooled over models, each aid
  arm vs A-baseline on paired tasks (present-classes only, 28
  tasks): exact sign test on correctness, p < .05 in the helpful
  direction for AT LEAST ONE of A-llmstxt / A-sitemap / A-markdown.
  (The techniques are sold as improving success, not just cost.)
- **H2 (the token claim):** in A-markdown and A-stacked, among
  cells where the model sent a markdown signal unprompted, mean
  input tokens per correct answer ≤ 60% of the same model's
  A-baseline mean. Cloudflare claims up to 80% savings; 40% is the
  registered conservative bar. If NO model ever sends the signal
  unprompted, H2 is VACUOUS and reported as such — that outcome is
  itself the headline (the claim's premise fails at the model
  layer).
- **H3 (no-harm, comparative — the sibling lesson):** no aid arm
  scores below A-baseline on correctness (pooled per model) by more
  than 2 tasks, and absent-class fabrication rate in every arm ≤
  baseline + 2 (aids must not manufacture confident wrong answers
  from richer navigation surface).
- **H4 (descriptive):** unprompted markdown-signal rate per model
  (the only-three-agents claim, model level); llms.txt consultation
  rate when present; fetch-count and grep-loop anatomy (repeated
  fetches of the same path); per-class breakdowns; absent-class
  sentinel discipline per model; cost per solved task per arm.
- **The study gate: H1, H3, and (unless vacuous) H2.**

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Gate passes | Retrieval-class agent-readiness is measured real: the passing aids are worth shipping on real sites, with the measured token economics; publish per-technique guidance |
| H1 fails (no aid moves correctness) | The aids are token-economics plays only — report H2/H4 economics as the whole story; correctness on a well-linked 40-page site is not navigation-limited |
| H2 vacuous (no unprompted markdown signals) | Cloudflare's negotiation premise fails at the model level: the technique helps only agents whose HARNESS sends the header — report prominently; a follow-up may test tool-description affordances (that is a new registration) |
| H3 fails | An aid measurably hurts (worse answers or induced fabrication) — publish the anatomy; that technique is anti-recommended for the measured class |
| Fixture defect discovered mid-run | Stop, fix, re-register, restart scored runs from zero — fixture drift voids cells |

## Cost fences

- **Pilot (authorized 2026-07-29 "proceed"):** gemini-3.5-flash ×
  all 5 arms × 36 tasks = 180 cells ≈ **$2–5**. Runs after this
  brief and the fixture/harness/grader tests are committed.
- **Full matrix:** +4 models = 720 further cells, ≈ **$40–90**
  (opus- and fable-class fetch loops dominate). Requires Kevin's
  explicit go-ahead after pilot results are published.

## Disclosure

The analyst model (fable-5) is not among Study 1's models; if it is
ever added, the sibling repo's self-scoring disclosure applies
(mechanical graders only, registered before its runs).
