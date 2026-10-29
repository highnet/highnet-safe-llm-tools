import type { Stage } from '@/lib/generated/trace';

// English copy for each pipeline step. Voice: a precise lab partner. Plain, exact,
// first-person plural, no hype; name trade-offs and say when a step is weak.
export type StageCopy = {
  title: string;
  why: string;
  detail: string;
};

// Agentic mode replaces the single retrieval pass with a plan and a loop of searches.
export const AGENT_STAGE_ORDER: Stage[] = [
  'request',
  'agent_plan',
  'agent_step',
  'select_context',
  'prompt',
  'generate',
  'citations',
];

export const STAGE_ORDER: Stage[] = [
  'request',
  'embed_query',
  'map_project',
  'bm25',
  'vector',
  'fuse',
  'rerank',
  'select_context',
  'prompt',
  'generate',
  'citations',
];

export const STAGES: Record<Stage, StageCopy> = {
  request: {
    title: 'Check the request',
    why: 'Every run calls paid APIs, so first we check your recent questions and this month’s budget. If either is used up we stop here and say why.',
    detail:
      'Limits are counted per hashed IP address. At 80% of the monthly cap the expensive features switch off; at 100% live queries stop until next month.',
  },
  embed_query: {
    title: 'Embed the question',
    why: 'We turn the question into an embedding, a list of numbers that places its meaning in space. Passages about the same thing land close by.',
    detail:
      'The question is embedded as a “query”, every passage as a “document”. Only the first 8 dimensions are drawn; vectors have length 1, so only direction matters.',
  },
  map_project: {
    title: 'Place it on the map',
    why: 'We flatten that space to two dimensions with PCA and drop the question onto it. Treat the map as a sketch: the search uses every dimension.',
    detail:
      'The percentages say how much of the spread the two axes keep. When they are low, neighbours on the map are not always the passages the search finds.',
  },
  bm25: {
    title: 'Keyword search (BM25)',
    why: 'BM25 scores passages by the question’s words, rare words counting most. It matches names and numbers exactly but misses synonyms.',
    detail:
      'SQLite FTS5 with the Porter stemmer, filtered to the chosen chunk size. Stop words are dropped and each term quoted, so your text is never read as query syntax.',
  },
  vector: {
    title: 'Vector search',
    why: 'Vector search keeps the passages whose embeddings sit closest to the question’s. It finds paraphrases, but can drift to passages merely on the same topic.',
    detail:
      'Cosine distance: 0 is the same direction, 1 unrelated. sqlite-vec compares against every chunk of the chosen size exactly; there is no approximate index.',
  },
  fuse: {
    title: 'Fuse the rankings',
    why: 'Hybrid search merges both rankings by rank, not score, so a passage near the top of both lists wins.',
    detail:
      'Reciprocal rank fusion: each list adds 1 / (60 + rank) to a passage’s score. Each search fetches twice top-k so fusion has candidates to promote.',
  },
  rerank: {
    title: 'Rerank',
    why: 'A reranker reads the question and each passage together, which is slower but judges relevance better. It is off by default because it adds time and cost.',
    detail: 'Voyage rerank-2.5-lite, applied to the candidates from the search steps.',
  },
  select_context: {
    title: 'Choose the context',
    why: 'Only the top passages reach the model, and they are the only facts it may use. A wrong answer usually means a wrong passage here.',
    detail:
      'Token counts here are estimates (words × 4/3). The exact count follows in the next step.',
  },
  prompt: {
    title: 'Write the prompt',
    why: 'This is the exact request the model receives: our instructions, the numbered passages and your question. If its worst-case cost could break the budget, we do not send it.',
    detail:
      'The token count comes from the provider’s counting endpoint. The worst case assumes the answer uses every allowed output token.',
  },
  generate: {
    title: 'Generate the answer',
    why: 'The model answers from the passages alone, citing them, and says so when they don’t hold the answer.',
    detail: 'Cost uses the token counts the API reports for this call, not an estimate.',
  },
  citations: {
    title: 'Check the citations',
    why: 'We map each citation back to its passage so every claim can be checked. A sentence without one is the model’s own glue.',
    detail:
      'Passages sent but never cited are listed too: they cost tokens without helping this answer.',
  },
  agent_plan: {
    title: 'Plan the searches',
    why: 'Some questions join facts from two articles. In agentic mode Claude splits the question first and writes one search per part.',
    detail:
      'The agent works through two tools: search runs the whole retrieval pipeline with your settings, answer says the passages are enough.',
  },
  agent_step: {
    title: 'Search, step by step',
    why: 'Each search is a full retrieval run, numbered 3a, 3b and so on. After each one Claude decides to search again or answer.',
    detail:
      'The loop stops when Claude calls answer, or at the first cap on searches or tokens it would cross, and says which.',
  },
};

// One plain sentence per step: what happened in this run. Every value is passed in from the
// trace (see lib/step-lead.ts); a skipped or failed step shows its own reason instead.
export const STAGE_LEADS = {
  request: (left: number, limit: number, tier: string) =>
    `Checks passed: ${left} of ${limit} questions left this minute, and the budget is ${tier}.`,
  embed: (dims: number, model: string) =>
    `Turned the question into ${dims.toLocaleString('en')} numbers with ${model}.`,
  map: (kept: string) =>
    `The question lands among the corpus passages; this flat map keeps ${kept} of the spread.`,
  bm25: (n: number, title: string, score: string) =>
    `Found ${n} passages by keyword; the best was from “${title}” (score ${score}).`,
  bm25None: 'No passage shares a search word with the question.',
  vector: (n: number, title: string, distance: string) =>
    `Found ${n} passages by meaning; the closest was from “${title}” (distance ${distance}).`,
  vectorNone: 'Vector search returned no passages.',
  fuse: (kept: number, both: number, title: string) =>
    `Kept the top ${kept}, ${both} found by both searches; first is “${title}”.`,
  fuseNone: 'Neither search found a passage to fuse.',
  rerank: (kept: number, moved: number, title: string) =>
    moved === 0
      ? `The reranker left the top ${kept} in place; first is still “${title}”.`
      : `The reranker moved ${moved} of the top ${kept}; first is now “${title}”.`,
  context: (n: number, tokens: string) =>
    n === 0
      ? 'No passages to send, so the model has nothing to answer from.'
      : `Sent the top ${n} passages to the model, about ${tokens} tokens.`,
  prompt: (tokens: string, worstCase: string) =>
    `The prompt is ${tokens} tokens; at most this answer could cost ${worstCase}.`,
  generate: (model: string, tokens: string, cost: string) =>
    `${model} wrote a ${tokens}-token answer; this call cost ${cost}.`,
  abstained: 'The model found no answer in the passages and said so, citing nothing.',
  noCitations: 'The answer cites no passage, so check it closely.',
  citations: (n: number, unused: number) =>
    `${n} ${n === 1 ? 'citation points' : 'citations point'} back to the passages; ${unused} sent ${unused === 1 ? 'was' : 'were'} never cited.`,
  plan: (n: number) =>
    n === 1 ? 'Claude planned 1 search.' : `Claude split the question into ${n} searches.`,
  searched: (n: number, found: number) =>
    `Claude ran ${n} ${n === 1 ? 'search' : 'searches'} and kept ${found} passages.`,
};
