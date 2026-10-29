---
version: 1
slug: 'web-app-rag-corpus-page-tsx'
primary_target: 'web/app/rag/corpus/page.tsx'
related_targets: ['web/components/corpus']
---

# Surface: corpus browser (`/rag/corpus/`)

Scope: the 35 articles every answer comes from, each shown as the searches see it. Visitor mode: **Read**, with two Operate controls (article, chunk size), both kept in the URL (`?doc=&chunks=`).

- Job: see that retrieval works on chunks, not articles, and where the chunk boundaries fall at each size.
- Content: `/api/corpus/documents` and `/api/corpus/documents/{id}`; no model calls, no cost.
- Honesty: the legend states whether this article at this size has any overlapping text; the shading appears only where it is true.
- Mobile: a native select replaces the list; the text reflows; markers are inline and never force horizontal scroll.

## Distilled (owner, 2026-10-29)

Owner feedback: "The whole thing is too dense with information, no one will read it." Direction chosen by the owner, no interview: progressive disclosure, one idea per step or section. Nothing was deleted and every number is still read from the trace or the eval JSON; it moved behind pencil disclosures (`components/ui/Disclosure`, closed by default, `aria-expanded`, never persisted).

- Two-sentence lede, the rest (licence, chunking) under "How this works"; the browser follows at once.

