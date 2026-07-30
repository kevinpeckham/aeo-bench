# aeo-bench

A pre-registered benchmark series on a practical question: do the
agent-readiness and answer-engine-optimization techniques being
recommended to website owners (llms.txt, sitemap.xml, markdown
content negotiation) measurably help AI agents use a website, and at
what token cost?

The techniques under test come from
[Cloudflare's agent-readiness proposal](https://blog.cloudflare.com/agent-readiness/).
The discipline comes from our sibling series,
[barkup-bench](https://github.com/kevinpeckham/barkup-bench).

**Status: active.** Study 1 (plus a registered re-score) is complete:
900 scored agent runs across five models. Results published as
found, corrections included.

## Read the results

- **[The dashboard](https://www.lightningjar.com/research/aeo-bench)**:
  each study as its own page with charts, tables, and plain-language
  takeaways. Start here.
- **[REPORT.md](REPORT.md)**: the full technical record, including
  the Study 1′ corrected-grader re-score.
- **[BRIEF.md](BRIEF.md)**: the Study 1 pre-registration (fixture,
  arms, tasks, gates, spend fences), committed before any scored run.

Headlines from Study 1: no model consulted llms.txt or sitemap.xml
even once in 900 runs; correctness saturated in every arm including
plain HTML; markdown negotiation was discovered unprompted by some
models and never by others, and its token savings scale with how
wasteful the agent already was; and zero cells invented a fact.

## How it works

- The "website" is **Petrel & Pine Supply Co.**, a fictional 40-page
  retailer generated deterministically from a committed fact corpus
  and served in-process with real HTTP semantics (content
  negotiation, discovery files, redirects). Nothing is deployed.
- Agents get a question, the root URL, and a fetch tool whose
  description never mentions any technique. Discovery is part of the
  measurement.
- 36 seeded tasks in four classes, including eight questions the
  site deliberately cannot answer, where the correct response is
  saying so.
- Grading is mechanical and unit-tested. Arms are site variants with
  one technique toggled against a shared baseline.

## The discipline

- Every study is pre-registered by commit before its first scored
  run: fixture, tasks, graders, hypotheses, interpretation table,
  and cost fences.
- Results publish whatever they show. Failed gates stay published
  with their anatomy.
- Corrections are re-registered and re-scored over frozen records,
  with both readings public.

## Reproduce

```sh
bun install                              # needs AI_GATEWAY_API_KEY in .env.local
bun test                                 # graders + fixture semantics + determinism
bunx varlock run -- bun run scripts/run-study1.ts   # pilot model by default; --models for more
bun run scripts/analyze-study1.ts        # gates + tier tables
bun run scripts/analyze-study1-prime.ts  # the corrected-grader re-score
```

Scored runs are resumable JSONL keyed by (task, arm, model). If you
reproduce, extend, or refute any of this, we want the issue.

MIT © Kevin Peckham
