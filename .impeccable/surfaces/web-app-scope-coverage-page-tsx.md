---
version: 1
slug: 'web-app-scope-coverage-page-tsx'
primary_target: 'web/app/scope/coverage/page.tsx'
related_targets: ['web/components/scope/coverage', 'web/lib/scope/map.ts']
---

# Surface: Scope dataset coverage (`/scope/coverage/`)

Scope: Sheet 4 of Scope. Where each preset's labeled examples are thin: the full-size scope map with empty grid cells inside the data's spread and the prompts the eval run misclassified. This is coverage of the dataset, not test coverage (that is `/rag/coverage/`). Visitor mode: **Read**, with one Operate control (the preset, kept in the URL as `?preset=`).

- Audience and job: developers deciding where the guard needs more examples. The job is to see gaps and misses on the same map the kNN step uses.
- Content: `public/scope/dataset.json` for the map and grid, the Scope eval result file for the misses; if no run is published the page says so instead of drawing misses.
- Constraints: every overlay has a legend sample and words (sparse cells dashed amber, misses ringed in red check); the misses list is a table with label and prediction as class tags; the empty cells' coordinates are available as a table; mobile-first.

## Direction contract

THESIS: The coverage page is the pad's map laid flat at full size, with the empty places marked in pencil.

OWN-WORLD: As DESIGN.md. Reuses the scope map, class marks, quiet pressed buttons and pencil folds.

FIRST VIEWPORT: "Sheet 4 · Where are the examples thin?", the lede, the preset switch and the top of the map.
