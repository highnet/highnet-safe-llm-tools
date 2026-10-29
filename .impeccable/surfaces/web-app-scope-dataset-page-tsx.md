---
version: 1
slug: 'web-app-scope-dataset-page-tsx'
primary_target: 'web/app/scope/dataset/page.tsx'
related_targets: ['web/components/scope/dataset']
---

# Surface: Scope labeled prompts (`/scope/dataset/`)

Scope: Sheet 2 of Scope. Every labeled prompt the nearest-neighbour vote uses and the evals score, filterable by preset, class, text and tag. Visitor mode: **Read**, with Operate filters kept in the URL (`?preset=&label=&q=&tag=`).

- Audience and job: developers judging whether the guard's examples are any good. The job is to see what each class looks like in each preset and to find any prompt by id.
- Content: `public/scope/dataset.json`, shipped with the site; no API call, no cost. Counts, build id, date and embedding model are read from the file.
- Honesty: the provenance line says plainly that Claude drafted the prompts and a script checked them, so individual labels are drafts.
- Constraints: class filters are class tags (shape plus word) with counts; the list shows forty rows at a time; mobile-first, no horizontal scroll at 320px.

## Direction contract

THESIS: The dataset is the pad's appendix: every example written out in full with its label, not summarised.

OWN-WORLD: As DESIGN.md. Filters in a dashed-ruled strip of quiet pressed buttons; the prompts as one solid-edged list with dashed rules between rows.

FIRST VIEWPORT: "Sheet 2 · The labeled prompts", the lede with the real counts, the provenance block, then the filters and the first prompts.
