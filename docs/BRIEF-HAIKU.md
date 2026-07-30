# BRIEF — the Haiku 4.5 backfill (Studies 1 + 2, identical runs; a candidate-model tier map)

**Pre-registration, committed before any scored run.** Lightning Jar
is considering `anthropic/claude-haiku-4.5` for a site chat agent
that would live on lj-website and answer from site content — the
exact task family this benchmark measures (fetch-tool retrieval
against a real site, honesty about absent information, token
economics). This backfill runs Haiku 4.5 through Studies 1 and 2
byte-identically: same fixtures, arms, tasks, graders, and caps.

Rules carried from the sibling series' backfill protocol:

- **Tier-map extension only.** No new hypotheses. All registered
  gates stay pinned to the original five models; Haiku joins as a
  descriptive column. The analyzers gain a GATE_MODELS pin so pooled
  gate arithmetic cannot move.
- Study 1 results are read under BOTH graders (v1 and the 1′
  corrections), like every other model.

## The decision read (registered up front)

What a site-chat-agent decision needs from these numbers, stated
before running:

1. **Retrieval correctness** on linked content (Study 1 all-classes;
   Study 2 shallow + deep) — can it find answers on a navigable
   site at all?
2. **Absent-class honesty** — a site agent that invents policies is
   disqualifying regardless of other scores. Study 1's sentinel
   discipline and Study 2's structured notOnSite are the measures.
3. **Protocol compliance** — Study 2's no-submit rate (gpt-oss's
   failure mode); a chat agent must reliably complete its answer
   protocol.
4. **Hint responsiveness** — the lj-website agent's harness would
   ship the one-sentence index affordance Study 2 measured; Haiku's
   hinted-arm orphan score tests whether it can use it.
5. **Economics** — tokens per solved task, and whether it sends
   markdown signals unprompted (lj-website serves /llms.txt and
   could serve markdown variants).

None of these are gates; the read is a recommendation input, not a
pass/fail. The decision remains Kevin's.

## Cells and cost fence

Study 1: 36 × 5 arms = 180 cells. Study 2: 32 × 6 arms = 192 cells.
372 cells ≈ **$8–20** at Haiku pricing (heavier Study 2 cells
dominate). Authorized 2026-07-30 ("I'd like to backfill both
studies … Haiku 4.5").

## Disclosure

Unchanged: mechanical graders committed before any Haiku run; the
analyst model is not the measured model.
