---
name: Highnet Safe LLM Tools
description: Two transparent LLM systems, RAG and Scope, worked out on an engineer's computation pad.
colors:
  paper: '#eef3e4'
  paper-raised: '#f7faf1'
  grid: '#d6e2c8'
  rule: '#a3b892'
  rule-input: '#76896a'
  graphite: '#232922'
  graphite-muted: '#4f5b4b'
  blue-pencil: '#2d5b9a'
  blue-wash: '#dce6f1'
  red-check: '#b0261d'
  amber-note: '#855600'
  green-tick: '#2f6b3b'
  data-bm25: '#8a5528'
  data-vector: '#2d5b9a'
  data-fused: '#6a4a99'
  data-rerank: '#3c7747'
  data-neutral: '#4f5b4b'
  lamp-paper: '#121913'
  lamp-paper-raised: '#19221a'
  lamp-grid: '#223025'
  lamp-rule: '#3d5140'
  lamp-rule-input: '#6e8571'
  lamp-graphite: '#e1e9d8'
  lamp-graphite-muted: '#a5b39e'
  lamp-blue-pencil: '#8fb5ea'
  lamp-blue-wash: '#1e2d41'
  lamp-red-check: '#f28b82'
  lamp-amber-note: '#e2b65e'
  lamp-green-tick: '#8cc79a'
  lamp-data-bm25: '#d9a06e'
  lamp-data-vector: '#8fb5ea'
  lamp-data-fused: '#b9a0e6'
  lamp-data-rerank: '#8cc79a'
  lamp-data-neutral: '#a5b39e'
typography:
  display:
    fontFamily: 'Recursive, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(2rem, 1.4rem + 2.4vw, 3.5rem)'
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: '-0.02em'
    fontVariation: "'MONO' 0, 'CASL' 0, 'slnt' 0"
  sheet-title:
    fontFamily: 'Recursive, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)'
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: '-0.01em'
    fontVariation: "'MONO' 0, 'CASL' 0, 'slnt' 0"
  step-heading:
    fontFamily: 'Recursive, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.375
    fontVariation: "'MONO' 0, 'CASL' 0, 'slnt' 0"
  answer:
    fontFamily: 'Recursive, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: 1.625
    fontVariation: "'MONO' 0, 'CASL' 0, 'slnt' 0"
  body:
    fontFamily: 'Recursive, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.625
    fontVariation: "'MONO' 0, 'CASL' 0, 'slnt' 0"
  small:
    fontFamily: 'Recursive, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "'MONO' 0, 'CASL' 0, 'slnt' 0"
  margin-note:
    fontFamily: 'Recursive, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 450
    lineHeight: 1.5
    fontVariation: "'MONO' 0, 'CASL' 0.5, 'slnt' -7"
  data:
    fontFamily: 'Recursive, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1, 'zero' 1"
    fontVariation: "'MONO' 1, 'CASL' 0, 'slnt' 0"
  label:
    fontFamily: 'Recursive, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: '0.04em'
    fontFeature: "'tnum' 1, 'zero' 1"
    fontVariation: "'MONO' 1, 'CASL' 0, 'slnt' 0"
  code:
    fontFamily: 'Recursive, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "'tnum' 1, 'zero' 1"
    fontVariation: "'MONO' 1, 'CASL' 0, 'slnt' 0"
rounded:
  none: '0px'
  sm: '2px'
  md: '4px'
spacing:
  square: '20px'
  step-gap: '8px'
  step-gap-md: '16px'
  section: '32px'
  section-md: '40px'
  page-inline: '16px'
  page-inline-md: '32px'
components:
  button-primary:
    backgroundColor: '{colors.blue-pencil}'
    textColor: '{colors.paper}'
    rounded: '{rounded.sm}'
    padding: '0 16px'
    height: '40px'
  button-primary-disabled:
    backgroundColor: '{colors.grid}'
    textColor: '{colors.graphite-muted}'
  button-quiet:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    rounded: '{rounded.sm}'
    padding: '0 16px'
    height: '40px'
  button-quiet-hover:
    backgroundColor: '{colors.blue-wash}'
  button-quiet-pressed:
    backgroundColor: '{colors.blue-wash}'
    textColor: '{colors.blue-pencil}'
  button-ghost:
    textColor: '{colors.graphite-muted}'
    rounded: '{rounded.sm}'
    size: '40px'
  button-ghost-hover:
    backgroundColor: '{colors.blue-wash}'
    textColor: '{colors.graphite}'
  button-pencil:
    textColor: '{colors.blue-pencil}'
    typography: '{typography.margin-note}'
    padding: '0'
  button-sm:
    rounded: '{rounded.sm}'
    padding: '0 12px'
    height: '32px'
  product-switcher:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite-muted}'
    typography: '{typography.data}'
    rounded: '{rounded.sm}'
    padding: '0 12px'
    height: '36px'
  product-switcher-current:
    backgroundColor: '{colors.blue-wash}'
    textColor: '{colors.blue-pencil}'
  input-field:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    padding: '0 12px'
    height: '44px'
  step-sheet:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    rounded: '{rounded.md}'
    padding: '16px 20px'
  step-sheet-pending:
    textColor: '{colors.graphite-muted}'
    rounded: '{rounded.md}'
    padding: '12px 20px'
  step-row-compact:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    rounded: '{rounded.md}'
    padding: '8px 12px'
    height: '48px'
  step-number:
    textColor: '{colors.graphite-muted}'
    typography: '{typography.data}'
  step-number-running:
    textColor: '{colors.blue-pencil}'
    typography: '{typography.data}'
  answer-sheet:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    typography: '{typography.answer}'
    rounded: '{rounded.md}'
    padding: '20px 24px'
  margin-note:
    textColor: '{colors.blue-pencil}'
    typography: '{typography.margin-note}'
    width: '272px'
  status-mark:
    typography: '{typography.label}'
  notice-note:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    typography: '{typography.small}'
    rounded: '{rounded.sm}'
    padding: '12px 16px'
  notice-warning:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    typography: '{typography.small}'
    rounded: '{rounded.sm}'
    padding: '12px 16px'
  notice-error:
    backgroundColor: '{colors.paper-raised}'
    textColor: '{colors.graphite}'
    typography: '{typography.small}'
    rounded: '{rounded.sm}'
    padding: '12px 16px'
  code-excerpt:
    textColor: '{colors.graphite}'
    typography: '{typography.code}'
    padding: '8px 0'
---

# Design System: Highnet Safe LLM Tools

## Overview

**Creative North Star: "The Engineer's Computation Pad"**

Highnet Safe LLM Tools is one pad holding two products: **RAG** (`/rag/`), a question worked out into a cited answer, and **Scope** (`/scope/`), a message worked out into one of four actions. A landing page at `/` introduces both and shows how they fit together. Both products use the same sheets, step track, margin notes and answer line; neither has a look of its own.

Each query is worked out like a calculation on pale-green engineering paper. The question is written at the top of the sheet, every pipeline stage is one numbered step below it, and the answer is the last line, marked with an `=` in the number margin. Graphite ink carries every fact and number. Blue pencil, the draughtsman's non-photo blue, is the one voice of annotation and action: "Why this step?" notes, the running step, links, focus and the Run button. Red means a failure and nothing else.

The mood is calm and exact. The page is plain pale-green paper with no ruled pattern (the owner removed the original 20px grid); structure comes from the sheets, the step track and the dashed rules alone. There are no gradients, glass, glows or illustrations; the trace data is the imagery. The dark theme is the same pad under a drafting lamp: a green-black ground, pale graphite and a brighter blue pencil. It is a change of lighting, not a different world.

Motion is sparse and has two authored moments: steps are written into the pad as their trace events arrive, and reranked rows settle from their old rank into their new one. A streaming answer shows a blinking blue-pencil caret. Under `prefers-reduced-motion`, every animation and transition collapses to an instant change.

**Key Characteristics:**

- One family, Recursive, in three voices set by its axes: prose, pencil and data.
- A single accent, blue pencil; a separate data palette for RAG's retrieval series and, under class names, Scope's four classes.
- Flat paper: 1px rules, 2px and 4px corners, no shadows anywhere.
- Solid rules for edges and for lists set on bare paper, dashed rules for the working inside a sheet and for steps not yet written.
- Step numbers hang in a margin; the running step is marked there, not on the sheet.
- Every state and every class is an SVG mark plus a word, never colour alone; an ink always travels with the same shape.

## Colors

Neutral paper and graphite with one pencil accent, three semantic inks and a data palette kept for charts, ranked series and Scope's classes. Each role is a CSS custom property on `:root`; the `.dark` class overrides the same property with its lamp value, recorded here with a `lamp-` prefix. Tailwind and shadcn names (`primary`, `card`, `border`, `input`, `ring`, `chart-1..5`, `class-*`) alias these roles and never carry their own values.

### Primary

- **Blue Pencil** (`blue-pencil` / `lamp-blue-pencil`): margin notes, the running step's number and mark, the primary button, pencil-style text actions, links and citation numbers, focus outlines and the input caret. It is also the only colour a code excerpt uses besides graphite.
- **Blue Wash** (`blue-wash` / `lamp-blue-wash`): the ground under a current selection: text selection, a targeted passage, the pressed quiet button and hover on quiet and ghost buttons.

### Neutral

- **Paper** (`paper`): the page ground, plain. Also the text colour on the primary button.
- **Raised Paper** (`paper-raised`): a sheet laid on the pad: step sheets, the answer sheet, notices, inputs and quiet buttons.
- **Grid Green** (`grid`): quiet fills (`muted`) and the disabled primary button fill. The name is historical; no grid is drawn.
- **Sheet Rule** (`rule`): every sheet edge, divider and table rule, solid or dashed; also the scrollbar thumb. Decorative, so below 3:1 on purpose.
- **Input Rule** (`rule-input`): the border of interactive controls (input and quiet button), at least 3:1 for WCAG 1.4.11.
- **Graphite** (`graphite`): body text, headings and values.
- **Muted Graphite** (`graphite-muted`): secondary text, units, timestamps, readouts, step numbers at rest and pending step titles.

### Semantic

- **Red Check** (`red-check`): a step failed, an error notice, an invalid input, the budget stopped.
- **Amber Note** (`amber-note`): warnings, such as a degraded budget, a lost stream connection or low scores.
- **Green Tick** (`green-tick`): a step or check passed.

### Data

One colour per retrieval series, for rank columns, chart series and badges: **BM25 Umber** (`data-bm25`), **Vector Blue** (`data-vector`), **Fused Violet** (`data-fused`), **Rerank Green** (`data-rerank`) and **Everything Else** (`data-neutral`). Each series also has a marker shape: a square for BM25, a circle for vector, a diamond for fused, a triangle for reranked. A rank badge is the coloured marker followed by the rank in graphite, with a screen-reader label naming the series, so colour is never the only cue. The fusion step shows the BM25 and vector rankings side by side from `lg` (stacked below), then the fused list with each passage's rank in both inputs, its RRF score over the two contributions, and a blue-pencil rule, always drawn, where the top-k cut falls. Candidates below the cut fold behind a pencil toggle under that rule; when opened, their rows and rank badges are muted (the marker shapes stay).

### Classes (Scope)

Scope sorts every message into one of four classes, and each class reuses one of the data inks with that ink's own marker shape. In `globals.css` the class inks are aliases, not new values: `--class-in: var(--data-rerank)`, `--class-adjacent: var(--data-vector)`, `--class-out: var(--data-bm25)`, `--class-injection: var(--data-fused)`, so they follow the lamp values automatically.

- **In scope** (`class-in` = Rerank Green): a triangle.
- **Adjacent** (`class-adjacent` = Vector Blue): a circle.
- **Off scope** (`class-out` = BM25 Umber): a square.
- **Injection** (`class-injection` = Fused Violet): a diamond.

A class is drawn by `ClassMark` (a 12px SVG, 10px small, 14px large) and is always followed by its word (`ClassTag`; the short forms "in", "adj.", "out", "inj." keep the full name for screen readers). Scope's four actions wear the shape of the class they serve: Answer = in, Answer briefly = adjacent, Redirect = off scope, Block = injection. The same marks appear on the landing page and in the Scope verdict on RAG's first step. On the scope map each prompt is its class shape at 75% opacity; the distribution bar is one ruled track with a segment per class, its values written beside it with shape and word.

### Named Rules

**The One Pencil Rule.** Blue pencil is the only accent. When something needs emphasis, use weight, scale, position or Recursive's casual axis before adding a colour. Code excerpts follow the same rule: keywords, built-ins and literals are blue pencil at 600, titles are graphite at 600, strings and numbers switch to the casual mono voice, comments are muted graphite in the pencil slant. The data palette is reserved for RAG's retrieval series and Scope's classes, and never tints code or chrome.

**The Red Means Wrong Rule.** Red appears only for failure. Never use it for brand, highlights or "important".

**The Lamp Rule.** The dark theme changes values, never roles. Every new colour is added to both `:root` and `.dark` under the same name.

**The One Ink, One Shape Rule.** Each data ink has exactly one shape, on both products: green triangle, blue circle, umber square, violet diamond. A Scope class takes an existing pair and never a new colour; the class tokens alias the data inks so the pair cannot drift. Never draw an ink in another shape, and never show a class or series by colour alone.

## Typography

**Display Font:** Recursive (with ui-sans-serif, system-ui)
**Body Font:** Recursive (with ui-sans-serif, system-ui)
**Label/Mono Font:** Recursive with MONO 1 (with ui-monospace, SFMono-Regular)

**Character:** One variable family used through its axes, so the pad reads as one person's hand and one instrument's readout. The linear sans (MONO 0, CASL 0, slnt 0) is the prose voice; the pencil voice (CASL 0.5, slnt -7) is the hand-lettered annotation; the data voice (MONO 1) with tabular, slashed-zero figures is for everything measured.

### Hierarchy

- **Display** (650, clamp 2rem to 3.5rem, 1.04, -0.02em, balanced): a page's one h1 headline, used three times on the site: the landing page, the RAG hero and the Scope hero. Nothing else uses it.
- **Sheet title** (650, clamp 1.5rem to 2.25rem, 1.1, -0.01em, balanced): the question or message at the top of the sheet, preceded by "Sheet N ·" in the muted data voice; each product numbers its own sheets 1 to 4. On the landing page it sets the product names and the section titles.
- **Step heading** (600, 1.125rem, 1.375): a step's title. Pending and skipped steps drop to 500 at 1rem in muted graphite; the compact phone row uses 1rem.
- **Answer** (400, 1.125rem, 1.625, max 68ch): the result line in the answer sheet.
- **Body** (400, 1rem, 1.625, max 68ch, pretty wrapping): explanations and passages.
- **Small** (400, 0.875rem, 1.5): notices, settings, supporting text.
- **Margin note** (450, 0.9375rem, 1.5, pencil voice, blue pencil): the "Why this step?" note.
- **Data** (400, 0.875rem, 1.5, data voice): scores, distances, IDs, settings values, the site name (semibold, 1rem in the header) and the product switcher.
- **Label** (500, 0.75rem, 1.25, +0.04em, data voice, sentence case): section headings such as "The working", status words and table column heads.
- **Code** (400, 0.75rem, 1.625, data voice): Python excerpts under each step.

### Named Rules

**The Numbers Are Mono Rule.** Anything measured (rank, score, distance, ms, tokens, $) is set in the data voice with tabular figures, so columns line up like a worked calculation.

**The Three Voices Rule.** Voice is set by Recursive's axes, never by another family. Prose is linear, annotation is pencil, measurement is mono. Labels stay sentence case; never all caps.

## Layout

The page is one centred column capped at 72rem, with 16px side padding on phones and 32px from `md`; product pages open 16px below the header (48px from `md`), the landing page 24px (64px from `md`). The body is flat paper. The header and footer are shared by every page (see Site header and footer). Spacing follows Tailwind's 4px steps: sheets are padded 16px by 20px, steps are 8px apart on phones and 16px from `md`, and the question block and the working are 32px apart (40px from `md`).

Every step and the answer share one three-track grid, so numbers, sheets and notes line up down the page:

- **Phones, below 768px:** a 2rem number track and the sheet, 12px apart. Each step is a one-line collapsible row. The settings strip folds into a one-line summary below `sm` (640px); the Run and Stop buttons shrink to 44px squares showing only their icon.
- **From `md`, 768px:** a 3rem number track and a 16px gap. A 1px vertical margin rule in `rule` runs the full height of the step list through the gutter between the numbers and the sheets (56px from the list's left edge). Steps render as open sheets.
- **From `lg`, 1024px:** a third track, 17rem wide, holds each step's blue-pencil margin note beside its sheet, with 32px gaps. Below `lg` the note opens the sheet instead: a paragraph of three to five sentences in the pencil voice, always visible, above the readout and the figure, with "Under the hood" folded beneath it. Beside a waiting step the margin stays empty; the note is written in with its step.

Motion belongs to the step. When a trace event arrives, the step is written in top to bottom with the write-in motion (a 4px rise and a top-down clip reveal on `cubic-bezier(0.16, 1, 0.3, 1)`), staged so the whole step lands in about 180ms: the number over 120ms, then the sheet over 140ms from 40ms, then the margin note over 90ms from 90ms. The answer sheet uses the same motion at 180ms. Pending and skipped steps do not animate.

## Elevation & Depth

The pad is flat and has no shadows. A sheet sits on the paper through a 1px rule and a raised-paper fill; a pending step is only a dashed outline on the bare paper. The answer sheet is set apart by a stronger outline, 1px graphite at 70%, not by lifting it. There are no overlays in this build.

### Named Rules

**The Flat Pad Rule.** No `box-shadow`, blur or glow on anything. Depth is paper fill and a 1px line.

## Shapes

Paper corners: 2px on controls, notices and the landing's worked-question sheets, 4px on sheets, and none on the pad, tables and passage lists. Nothing is pill-shaped or circular except SVG status marks. Every line is 1px: solid for a sheet's edge, for the section rules under headings and above the footer, and between the items of a list of statements set on bare paper (the landing principles, Scope's "What we hold to"); dashed for the working inside a sheet (dividers between details, the settings strip, rank-table and eval-table rows, passage and prompt lists, code captions, the Scope verdict on RAG step 01) and for the outline of anything not written yet (pending steps, the "built once" boxes of a diagram). Focus is a 2px blue-pencil outline, offset 2px (0px on inputs, where the border also turns blue pencil).

The running step is marked in the number margin, not on the sheet: its number turns blue pencil and a 2px blue-pencil rule hangs from the number down the full height of the step.

### Named Rules

**The Dashed Is Inside Rule.** A solid rule bounds a thing or divides a list of statements on bare paper; a dashed rule divides the working inside a sheet (rows of a table or record) or outlines something still to come.

**The Margin Carries the Mark Rule.** Step state that needs a line lives in the number margin. Never add a thick coloured stripe to a sheet's edge.

## Components

### Buttons

Plain paper controls: 14px medium sans, 2px corners, 8px icon gap, 16px SVG icons.

- **Shape:** squared paper corners (2px); default height 40px with 16px padding, small 32px with 12px padding at 13px, icon 40px square, inline with no box.
- **Primary:** blue-pencil fill with paper text, for Run. Hover mixes 18% graphite into the fill; pressed nudges down 1px; disabled is a grid-green fill with muted text.
- **Quiet:** raised paper with a 1px input rule and graphite text, for Stop and the top-k steppers. Hover lays a blue wash; pressed (`aria-pressed`) adds a blue-pencil border and text on the wash.
- **Ghost:** muted text on nothing; hover lays a blue wash and darkens the text. Used for the theme toggle.
- **Pencil:** a text action in the pencil voice and blue pencil with a dotted underline that turns solid on hover. Used for suggested questions, retry, and "show code", "show passage" and "under the hood" disclosures. Links between pages take the same look (pencil voice, 14px, at least 40px tall, a 14px arrow after the words).
- **Focus:** 2px blue-pencil outline, offset 2px, on every variant.

### Inputs / Fields

- **Style:** 44px tall, raised paper, 1px input rule, 2px corners, 12px inline padding, 16px text, muted placeholder, blue-pencil caret.
- **Hover / Focus:** hover darkens the border to graphite at 60%; focus turns the border blue pencil and adds a 2px blue-pencil outline with no offset.
- **Error / Disabled:** invalid turns the border red check; disabled drops the fill to transparent.

### Typography

A single `Typography` primitive carries the ramp as variants (`display`, `sheetTitle`, `stepHeading`, `body`, `small`, `marginNote`, `data`, `label`) with default elements (h1, h1, h3, p, p, p, span, span) and colour variants `default`, `muted`, `pencil`, `destructive`, `warning` and `success`. New text uses a variant before any one-off class.

### Step Sheet (signature)

A numbered step of the calculation: the two-digit number in the data voice in the margin track, the working on a raised-paper sheet (1px rule, 4px corners, 16px by 20px padding) and the pencil note beside it from `lg`. The header puts the step heading on the left and the readout (ms, tokens, $ in muted data) and status mark on the right. Details below a dashed rule hold the stage body, the inline "Why this step?" (below `lg`) and the code excerpt. Pending and skipped steps are dashed outlines with no fill and muted titles; a failed step's border turns red check.

Below 768px each step is a one-line collapsible row at least 48px tall: the title, a two-line muted data summary of the result, the status mark and a blue-pencil chevron that turns 180° when open.

### Status Mark

A 14px SVG mark (lucide stroke, 2.25 weight) plus a word in the label size and data voice: pending (open circle, muted), running (spinning loader, blue pencil), ok (check, green tick), skipped (minus, muted), warning (triangle, amber note), error (cross, red check).

### Notice

A raised-paper strip with 2px corners, a 1px toned border, 12px by 16px padding, small text in graphite and a 16px toned SVG icon. Three tones: **note** (blue pencil border at 60%, flask icon) for starting and illustrative-data states; **warning** (amber note border, triangle) for a degraded budget or a dropped stream; **error** (red check border, circle alert, `role="alert"`) for an offline API or a stopped budget.

### Answer Sheet

The result line: an `=` in blue pencil in the number margin, then a raised-paper sheet with a graphite outline at 70%, a muted label heading, the answer at 1.125rem with superscript blue-pencil citation numbers, a dashed rule, the sources list and a totals line in muted data.

### Step Figures

Each step carries one small figure, drawn from that run's trace and placed above the step's tables. Figures are HTML and CSS, not charts: a Bar is a 1px-ruled track in quiet green with filled segments laid end to end and optional 1px graphite tick marks for thresholds. Colour keeps its meaning. The three retrieval series use their data colours (BM25 umber for term weights, vector blue for distances and embedding values, both for fusion contributions); everything else is blue pencil (the part that matters: used requests, passages, input), graphite (the question, output cost), soft graphite (reserved room, uncited passages) or the tier colours on the budget meter. Every figure has a one-line caption in small muted prose that says how to read it, and a text alternative with the same numbers; the citation grid is a real table instead. Nothing animates. On phones a figure folds away with its step.

### Rerank Step

The reranked list keeps the rank table's fixed columns: new rank (in the data voice; the triangle marker is omitted here because it reads as a move), passage, old rank with an up or down arrow and the size of the move (a dash when it stayed), and relevance as a number over a thin rerank-green bar on a 0 to 1 scale. The same always-drawn blue-pencil top-k cut and folded candidates below it as fusion. On arrival each row slides from its old place to its new one in about 600ms with an exponential ease-out: the signature moment of the reranker. With reduced motion the rows simply appear in their new order.

### Corpus Map

A square plot framed by dashed top and bottom rules, never a filled box. Every chunk of the chosen set is a small soft-graphite dot; the question is a blue-pencil crosshair with a ring and a pencil-voice "your question" label; the retrieved passages are larger blue-pencil dots with their rank numbers set as HTML callouts over the plot, placed clear of dots, the crosshair and each other, with a 1px graphite leader line when a label has to move away from its dot. The question's neighbourhood is drawn again, magnified, in a dashed detail inset in the emptiest corner (labelled "Detail"), joined to a dashed box round the crosshair by a 1px leader; there the question's five nearest dots on the map are ringed in graphite, which shows when the map and the search disagree. Articles are not colour-coded (35 cannot be told apart): pointing at or tapping a dot darkens every chunk of its article and names it under the plot. Axis captions say what share of the spread each axis keeps. A table with the same positions and map distances sits behind a pencil toggle, grouped into Retrieved and Nearest on map; each row's name is a pencil button that lights its article on the plot (keyboard included), and the readout under the plot is a polite live region. Phones drop the x and y columns. Phones get the same plot, scaled to the sheet.

### Agent Steps

Agentic runs draw seven steps. The plan step sets Claude's plan in the pencil voice (it is the model thinking aloud), the planned queries as numbered chips (3a, 3b, …) with 1px dashed outlines, then model and caps as facts and the agent's instructions behind a pencil toggle. "Search, step by step" opens with two meters, searches and agent tokens against their caps, then one sub-sheet per tool call separated by dashed rules, never nested boxes: the blue-pencil sub-label and tool name, the query as a dashed chip, the step's readout and status mark, Claude's note in pencil, the passages that search kept, and its own stages folded behind a pencil toggle. Answers, stops at a cap (amber), tool errors and tool-less turns each read as one plain line. On phones the whole sheet folds to "N searches · M passages".

### Product Switcher

The two products as one ruled pair of links in the header: a 2px-cornered strip of raised paper with a 1px input rule, a 1px rule between the two, each link 36px tall with 12px padding in the data voice and muted graphite. The current product sits on the blue wash in blue pencil at 600, so it reads by weight as well as colour; on the landing page neither is current. Hover lays the blue wash. Focus draws the 2px blue-pencil outline round the whole strip. It is built like the segmented control Scope's settings use.

### Class Mark and Distribution Bar

See Classes (Scope) under Colors. A class mark is never shown without its word nearby. The distribution bar is 12px tall, ruled in the input rule over a quiet fill, segments in class order separated by 1px raised-paper gaps; it is hidden from assistive tech because the values printed beside it carry the same numbers.

### Code Excerpt

Opened by a pencil action with a code icon. Each excerpt has a caption over a dashed rule (title in small sans, `file:start–end` link in muted data) and a scrolling block at 0.75rem in the data voice, coloured by the One Pencil Rule.

## Do's and Don'ts

### Do:

- **Do** let real trace data be the only imagery: scores, distances, prompts, passages.
- **Do** keep every measured value in the data voice with its unit, taken from the actual trace.
- **Do** show states with an SVG mark and a word as well as colour, in both themes.
- **Do** put new colours in both `:root` and `.dark` under one name, and reach them through the shadcn aliases.
- **Do** write a new step in with the staged write-in motion and let reduced motion make it instant.
- **Don't** bring back a background pattern (grid, dots, lines); the owner rejected it. The paper stays plain.

### Don't:

- **Don't** ship default shadcn styling. Every primitive is restyled to these tokens.
- **Don't** add shadows, gradients, glassmorphism, glows or neon.
- **Don't** use decorative illustrations, or icons that stand in for data.
- **Don't** add a thick coloured stripe to a sheet's edge; step state goes in the number margin.
- **Don't** colour code or UI chrome from the data palette, or add a second accent colour for emphasis.
- **Don't** use red for anything except failure.
- **Don't** turn the paper metaphor into a costume: no torn edges, coffee stains, spiral bindings or a second, handwriting family.
- **Don't** set labels in all caps or put a small label above a heading as decoration.

## RAG evals report (`/rag/evals/`)

Sheet 2 of the same pad: the sheet title "Sheet 2 · How well does it work?", a lede, and a run record on a dashed rule (date, corpus build, the models the run actually called, cost). Each question the evals answer is a raised sheet with its blue-pencil note in the margin from `lg` and above the working below it. Retrieval results are one small table per chunk size (modes down the side with their series markers, reranker off and on across): a thin bar in graphite (off) or rerank green (on) with the value in the data voice. The visitor's own setting, linked from an answer, sits on blue wash with a pencil "your settings". A section the run did not measure is a dashed box that says so and why, never an empty chart.

## RAG hero (`/rag/`)

The RAG pipeline page opens with a hero in two columns from `lg` (5:7): on the left the one Display headline, "Watch a RAG system work out an answer, step by step.", then the definition of RAG as a term and its definition (the term in the data voice, its expansion muted, the definition in body graphite), a short muted intro, and two actions: the primary "Try a question" (jumps to the sheet) and a pencil "Browse the corpus". On the right, the pipeline diagram is the hero's only picture, bounded by a 1px solid rule with 4px corners on bare paper. The hero keeps extra space below it (16px, 40px from `md`, on top of the page rhythm) so it reads as its own section before Sheet 1. Phones stack the two, so the diagram lands one scroll down. There is no image, eyebrow or metric strip; the real pipeline is the picture.

## Share cards

Three cards are drawn at build time for link previews, from one renderer: `/og.png` for the site (the site name, its tagline, the two products as "RAG: question to cited answer" and "Scope: message to action", ending in "Every step on the page"), `/rag/og.png` (the RAG hero headline and its eleven steps ending in "= Answer") and `/scope/og.png` (Scope's tagline and its twelve steps ending in its result, set compact). Each is the light pad, the name in the data voice, the headline, and the steps as ruled boxes joined by chevrons, numbered in the data voice, ending in a blue-pencil "=". It is set in Recursive (static 400 and 700 instances of the prose and MONO cuts, vendored under `web/assets/fonts` with their OFL licence), and its colours are read from `globals.css`, so it never drifts from the tokens.

## Pipeline diagram

In the RAG hero's right column (see RAG hero), a figure draws the whole system in two labelled rows: what was built once ahead of time (dashed boxes, not interactive), then every step a question goes through, as small boxes joined by chevrons, numbered like the steps below and linked to them. BM25 and vector search stack as one pair because they run side by side; the row ends in an "= Answer" box outlined like the answer sheet. The boxes follow the run: dashed while waiting or skipped, raised paper once done, blue pencil while running, a red edge on failure. With the agent on, the row follows the agentic order. Below `lg` the "Built once, ahead of time" row, which is context rather than something to click, folds behind a pencil toggle, so on phones the steps a question takes come first.

## Formulas

Each step sheet carries its step as one line of relational algebra in a dashed box labelled "As a formula", under the step's paragraph. Readers are assumed to know relational algebra: standard operators are plain text, while the relations, the extended operators (τ, λ, γ), the domain functions (score, cos, rrf, relevance) and the values are underlined blue-pencil terms. Tapping or hovering a term writes its definition on the line below the formula, in place, so it works the same on a phone; nothing floats. Under the pipeline diagram a folded "The same pipeline, as formulas" lists these building blocks as small ruled blocks, grouped as relations, extended operators, functions and values, and ends with the whole run as one composition read right to left.

## RAG corpus page (`/rag/corpus/`)

Sheet 3 of the pad. A chunk-size switch and the article list (a native select on phones, a scrolling list from `lg`), then the chosen article on a raised sheet: its text with each chunk's start marked by its id in a small blue-pencil box, and any text held by two chunks at once on blue wash. The note above the text says which is true for this article and size: it never promises an overlap that is not there.

## RAG coverage page (`/rag/coverage/`)

Sheet 4 of the pad, "Is every line tested?", built like the evals report: a lede, then a record on dashed rules (tests per suite, the 100% rule, when CI checks it). Each package (the API, the eval runner, this website) is a raised sheet with its note in the margin: its source root and tool in the data voice, then lines and branches as a share with its counts and a thin graphite bar. A pencil fold, "All N files", opens a dense table of every file with its lines and branches as "covered of total" (a dash where a file has no branches). Anything short of 100% carries an amber warning mark and the words "below 100%", never colour alone, and shares are never rounded up. Every number comes from `web/lib/generated/coverage.json`, which CI rewrites from its own test run and fails if it differs.

## Question picker (replay)

With live questions off, the question box becomes "Pick a question": two groups under label headings, "One article" and "Two articles: switch the agent on", each a grid of quiet buttons (one column on phones, two from `sm`) whose pressed state is the blue wash with blue-pencil text. Groups longer than four fold to three behind a pencil "N more" toggle, and a folded question that is selected keeps its group open. A note-tone notice under the title says the runs are recordings, when they were made, and that nothing is spent. Changing a setting replays at once, so the stale-settings note never shows.

## Site header and footer

Every page shares one header and one footer. The header is a single flex row from `md`: the site name, "Highnet Safe LLM Tools", in the data voice at 600 (a link to `/`, laying the blue wash on hover), the product switcher, the current product's four pages pushed right, and the theme toggle last. On phones the order changes: the name and the theme toggle share the first row, and a full-width break sends the switcher and the page links to the second. The landing page shows only the name, the switcher and the toggle. The current page link is graphite at 600 with a 2px blue-pencil underline; the others are muted and lay the blue wash on hover. There is no tagline in the header. From `md` it stays at the top while the page scrolls, on paper, and draws its 1px `rule` underneath only once the page has moved under it (no shadow); on phones it scrolls away, because two rows would take too much of a small screen. `scroll-padding-top` keeps linked steps clear of it from `md`.

The footer sits above a solid rule, 64px below the page. From `sm` it is four columns: RAG's pages, Scope's pages, the project (Overview, the source on GitHub, highnet.at), each under a muted label heading with blue-pencil links, then, right-aligned, the site name in the data voice, its tagline, the corpus attribution the licence requires and the note that Scope's prompts were drafted by Claude and checked by script. On phones the two product lists sit side by side, the project list below them, and the name block spans the full width.

## Landing page (`/`)

The site's opening page says what the site is before either product. It opens with the Display headline, "Safe LLM systems, worked out step by step.", and a one-paragraph intro at 1.125rem, capped at 56rem, with no picture, eyebrow or metric strip.

**Product sheets.** Each product is one section under a solid top rule, two columns from `lg` (5:7): on the left the product name as a sheet title, its tagline as a step heading, a muted lede, its takeaway in the pencil voice ("The answer is only as good as what was retrieved.", "Refusing a good message is a failure too."), the primary "Open …" button and a pencil link to that product's evals. On the right is the product's real step chain, read from the same step lists the product pages use: each step a small raised-paper box with a 1px rule, 2px corners and its two-digit number in the muted data voice, joined by muted chevrons and wrapping freely. The chain ends in an outlined result box, 1px graphite at 70% like the answer sheet, with a blue-pencil "=": "Cited answer" for RAG, the four actions with their class marks, split by muted slashes, for Scope.

**How they fit together.** A sheet title and a muted lede, then two worked questions side by side from `lg`, each on raised paper with a 1px rule and 2px corners: the question in the data voice, a step-heading title, a muted paragraph, then three numbered lines between solid rules, each with its mark in a 2rem margin in the data voice and a muted label: **01 Scope** (the recorded Scope verdict, its class mark and fused confidence, then what the LLM judge alone said, all read from the exported verdicts), **02 RAG** (what retrieval did) and **= Outcome** (the result at 600). Pencil links under the sheet open that run in Scope or RAG.

**Principles.** A sheet title, then the three convictions both tools argue as body paragraphs in a list capped at 68ch, divided by solid rules with a solid rule above and below: a list of statements on bare paper, not cards. A pencil link leads to the principles on the Scope page.

## Scope pipeline (`/scope/`)

Sheet 1 of Scope, built like the RAG pipeline page.

**Hero.** Two columns from `lg` (5:7): the Display headline, "Watch an AI agent decide whether a message is in scope, step by step.", the term "Scope guard" in the data voice with its expansion muted and its definition in body graphite, a muted intro, the primary "Try a message" (jumps to the sheet) and a pencil "Browse the labeled prompts". On the right the Scope diagram is the only picture, bounded by a 1px solid rule with 4px corners.

**Scope diagram.** "The whole guard on one page": a "Built once, ahead of time" row of dashed, muted boxes (folded behind a pencil toggle below `lg`), then "Every message" as the twelve steps in small numbered boxes joined by chevrons, each linked to its step. The boxes follow the run like the RAG diagram: dashed while pending or skipped, raised paper once done, blue pencil while running, a red edge on failure. The row ends in a box outlined in graphite at 70% with a blue-pencil "=" and the four actions as class tags; once a run decides, the chosen action turns 600 and the others go muted. A muted note says how the signals combine, and a pencil fold, "The same guard, as formulas", lists the formulas in small dashed boxes.

**What we hold to.** Three principles under a step heading with a solid rule beneath it, as a list divided by solid rules: each claim at 600 on the left and its reasoning muted on the right from `md` (2:3), with pencil links where a claim cites a source.

**The sheet.** "Sheet 1 · <message>" as the sheet title, then the note-tone replay notice, the message picker (preset as quiet pressed buttons, then example messages as a grid of quiet buttons, two columns from `sm`), and, under the RAG corpus assistant preset only, "Scope first, then RAG": a raised sheet holding the World Cup and lasagna questions as two rows divided by a dashed rule, each with a pencil replay button and, for the World Cup, a link to the same question in RAG. The settings strip (signals as quiet pressed buttons, conversation context as a segmented control, weights and thresholds as sliders, k as a stepper, all in a dashed-ruled strip that folds to a one-line summary below `sm`) and the scope definition editor (a raised, collapsible sheet listing each topic with a segmented control to move it between classes, rows divided by dashed rules) follow.

**The working.** A label heading over a solid rule, then the twelve steps as the RAG pipeline's own step sheets: the same number margin and margin rule, write-in motion, pencil notes, code excerpts and phone rows. Step bodies reuse the RAG figures: the bar, the distribution bar per signal, the scope map (each labeled prompt as its class shape, the message as a blue-pencil crosshair with a pencil "you" label, its five nearest on the map ringed in graphite), the judge's raw reply in a dashed box, and the thresholds band, a ruled track split into the action bands with the chosen band on the blue wash and a 2px blue-pencil needle at the scope score.

**The second judge (step 08).** Built like the judge's sheet: the chosen label as a class tag with its probability, the four probabilities as a distribution bar with class marks (never colour alone), one line saying whether it agrees with the LLM judge when both ran, the model and recorded date in muted data, and the gateway's own cost figure beside ours when the reply carried one. The typed question (instructions and one criterion per label) folds behind a pencil toggle in the shared verbatim box. An incomplete reply is a red-check error with the raw answers shown; a skip reads like the judge's.

**Result.** The answer line, as in RAG: a blue-pencil "=" in the number margin, then a raised sheet outlined in graphite at 70% with a muted label, the action as a large class tag at 600, the scope score and injection probability in the data voice, and, once the run is done, totals (ms, tokens, $, steps) under a dashed rule.

## Scope verdict on RAG step 01

RAG's first step, "Check the request", carries Scope's recorded verdict on that exact question under its RAG corpus assistant preset, read from the exported verdicts and never typed in. It sits inside the step sheet below a dashed rule: a muted label heading, a small lede, then a two-column definition list (Action with its class mark at 600 in the data voice, fused confidence, what the LLM judge said), a muted line that getting past Scope does not mean the corpus holds the answer (shown unless the action is redirect or block), and a pencil link to the full Scope breakdown. A question with no recorded verdict gets one muted line saying so.

## Scope dataset (`/scope/dataset/`)

Sheet 2 of Scope, "The labeled prompts". A muted lede counts the prompts and presets from the data; a provenance block says, in plain words, that Claude drafted them and a script checked them, then the build id, date and embedding model in muted data. The filters sit in one dashed-ruled strip: preset and class as quiet pressed buttons (each class button is its class tag with its count in muted data), a search input and a native tag select. A polite live line in the data voice counts the matches. The prompts are one list with solid edges and dashed rules between rows: earlier turns under a muted label, the prompt text at 68ch, then a muted data line with the class tag in graphite, topic, language, tags as small dashed chips and the id. Filters live in the URL; forty rows show at a time, with a quiet "show more".

## Scope evals (`/scope/evals/`)

Sheet 3 of Scope, "How well does each signal guard the scope?", built like the RAG evals report: a lede, the run record in the data voice on dashed rules (date, build, models, prompts, k, weights, thresholds, cost), then one raised sheet per question with its pencil notes in the margin from `lg`. The finding is a paragraph phrased from the numbers. The two errors, false refusal and over-compliance, sit side by side per method as the shared measure rows (share, counts and a thin bar). Precision and recall per class and the confusion matrices are small tables with class tags as row and column heads, dashed between rows; a confusion matrix's diagonal sits on the blue wash at 600 and zeros are muted.

**Sweep charts.** "Moving the redirect threshold" is the site's one line chart, drawn once per method: an SVG plot with a solid left and bottom axis, false refusal as a 1.5px solid graphite line and over-compliance as a 1.5px dashed blue-pencil line (so the two differ by pattern as well as colour), the threshold the run used as a dashed rule-coloured vertical, and 0%/100% and 0/1 ticks in 11px muted data. A legend draws both line styles with their names. A pencil fold opens the same numbers as a table. Cost and latency per method and per model close the report as tables with a solid-ruled total row.

## Scope coverage (`/scope/coverage/`)

Sheet 4 of Scope, "Where are the examples thin?". This page is about the dataset's coverage of each preset's map, not test coverage. A preset switch (quiet pressed buttons, kept in the URL), then the scope map at full size (capped at 48rem): every prompt as its class shape, empty grid cells inside the data's hull outlined in dashed amber on a faint amber fill, and prompts the evals misclassified ringed in red check. The legend names each class with its count and each overlay with a sample of its mark. A plain sentence counts the empty cells and a muted caveat follows. "Misclassified in the eval run" is a table of prompt, then label and prediction as two class tags joined by an arrow, each id a dotted pencil link into the dataset; the empty cells' coordinates fold behind a pencil toggle as a table.
