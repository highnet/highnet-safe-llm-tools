// English copy for Scope verdicts shown outside the Scope pages: the landing page and the RAG
// pipeline's first step. The Scope pages have their own catalogue (content/scope.ts).

export const SCOPE_ACTIONS = {
  answer: { text: 'Answer', label: 'in' },
  answer_briefly: { text: 'Answer briefly', label: 'adjacent' },
  redirect: { text: 'Redirect', label: 'out' },
  block: { text: 'Block', label: 'injection' },
} as const;

export type ScopeAction = keyof typeof SCOPE_ACTIONS;

export const SCOPE_VERDICT = {
  title: 'Scope’s verdict on this question',
  lede: 'Before RAG searches, a scope guard can decide whether the question is one this assistant is for. Scope recorded this exact question under its RAG corpus assistant preset:',
  action: 'Action',
  confidence: 'Fused confidence',
  judge: 'LLM judge',
  judgeFailed: 'reply failed validation',
  link: 'See the full Scope breakdown',
  inScopeNotInCorpus:
    'Getting past Scope does not mean answerable: Scope only decides whether the question is the kind this assistant serves. Whether the 35 articles hold the answer is retrieval’s job, below.',
  missing: 'Scope has no recorded verdict for this question.',
};
