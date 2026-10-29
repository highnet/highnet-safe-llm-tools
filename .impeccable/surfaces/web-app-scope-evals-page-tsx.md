---
version: 1
slug: 'web-app-scope-evals-page-tsx'
primary_target: 'web/app/scope/evals/page.tsx'
related_targets: ['web/components/scope/evals', 'web/components/evals']
---

# Surface: Scope evals report (`/scope/evals/`)

Scope: Sheet 3 of Scope. The published offline eval run, read-only: how each method (rules, kNN, the LLM judge, fused) guards the scope. Visitor mode: **Read**, with an Operate layer (the sweep table fold).

- Audience and job: developers and recruiters checking which signal earns its cost. The job is to weigh the two errors, false refusal and over-compliance (plus injections missed), side by side.
- Content: only the Scope eval result file (`lib/generated/scope-evals-latest.json`), copied in at build time; the per-prompt details are linked on GitHub. Stand-in runs say so in a note-tone notice.
- Structure: a lede and a run record on dashed rules (date, build, models, prompts, k, weights, thresholds, cost), then one sheet per question with pencil notes in the margin: the finding, the two errors, precision and recall per class, confusion matrices, the redirect-threshold sweep, cost and latency, and how to read the numbers.
- Constraints: static export; every number from the result file; tables are real tables with captions; the sweep charts tell their two lines apart by pattern (solid graphite, dashed blue pencil) as well as colour and have a table alternative.

## Direction contract

THESIS: The Scope evals are Sheet 3 of the same pad: the counts behind each rate are visible, so no single headline number has to be trusted.

OWN-WORLD: As DESIGN.md. Reuses the RAG evals report's sheets, measure rows and dashed record; adds the class tags as table heads and the sweep line charts.

FIRST VIEWPORT: "Sheet 3 · How well does each signal guard the scope?", the lede, the run record, then "What this run found".
