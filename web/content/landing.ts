// English copy for the shared landing page (/). Voice: the precise lab partner of both products.

export const LANDING = {
  metaTitle: 'Highnet Safe LLM Tools: safe LLM systems, worked out step by step',
  // The hero: the site's one Display headline, then what this is, before any product.
  title: 'Safe LLM systems, worked out step by step.',
  intro:
    'Two small lab tools that take one message through a real LLM system and show every step it takes, with the real numbers.',
  productsTitle: 'The two tools',
  more: 'Read more: how they work and fit together',
  less: 'Show less',
  howTitle: 'How each tool works',
  rag: {
    lede: 'A question goes in; a cited answer comes out. In between: an embedding, keyword and vector search, fusion, reranking, the exact prompt Claude sees, and citations checked against the passages.',
    takeaway: 'The answer is only as good as what was retrieved.',
    line: 'Ask a question about 35 Wikipedia articles and see how a cited answer is found.',
    open: 'Try RAG',
    secondary: { href: '/rag/evals/', text: 'How well does retrieval work?' },
    result: 'Cited answer',
  },
  scope: {
    lede: 'A message goes in; one of four actions comes out. In between: cheap rules, a nearest-neighbour vote over 1,200 labeled prompts, and an LLM judge whose JSON reply is validated and a decision model that returns a probability per label, fused and run through thresholds.',
    takeaway: 'Refusing a good message is a failure too.',
    line: 'Send a message and see whether an AI agent answers it, redirects it or blocks it.',
    open: 'Try Scope',
    secondary: { href: '/scope/evals/', text: 'False refusals versus attacks that get through' },
    actions: ['Answer', 'Answer briefly', 'Redirect', 'Block'],
  },
  connect: {
    title: 'How they fit together',
    lede: 'A question meets Scope before it meets retrieval. RAG’s first step shows the Scope verdict recorded for that exact question under the RAG corpus assistant preset, and links to the full breakdown. Two questions show why the two checks are different.',
    worldCup: {
      question: 'Who won the 2018 FIFA World Cup?',
      title: 'Let through, but not in the corpus',
      body: 'A factual question is the kind this assistant is for, so the guard should let it through. Retrieval then finds nothing about the 2018 World Cup in the 35 articles, and the RAG pipeline says so instead of guessing.',
      rag: 'RAG searches the 35 articles, finds no passage about the 2018 World Cup and abstains.',
      outcome: 'A plain “not in this library” instead of a guess.',
      scopeLink: 'See Scope decide',
      ragLink: 'See RAG abstain',
    },
    lasagna: {
      question: 'What’s a good lasagna recipe?',
      title: 'Off scope',
      body: 'A recipe is not what this assistant is for, whatever the library holds. Scope sends a warm redirect back to the kind of question it can answer, before any search runs.',
      rag: 'RAG never runs: no search, no prompt, no tokens spent.',
      outcome: 'A warm redirect to the questions this assistant can answer.',
      scopeLink: 'See Scope decide',
    },
    verdict: (action: string, confidence: string) =>
      `Recorded Scope verdict: ${action}, fused confidence ${confidence}.`,
    judge: (label: string, confidence: string) =>
      `The LLM judge alone said ${label} (${confidence}).`,
    judgeFailed: 'The LLM judge’s reply failed validation, so it dropped out.',
    decide: (label: string, p: string) => `The decision model said ${label} (p ${p}).`,
    steps: { scope: 'Scope', rag: 'RAG' },
    outcome: 'Outcome',
  },
  principlesTitle: 'What the two tools are arguing',
  principles: [
    'Off scope and prompt injection are different problems. The first is product design, the second is security.',
    'A guard that refuses good messages has failed as surely as one that lets attacks through, so we measure both.',
    'Filters alone fail against adaptive attackers. Real safety comes from architecture: least privilege, documents treated as data, untrusted content kept away from tools.',
  ],
  principlesLink: 'Read the principles on the Scope page',
  // The site's share card (/og.png).
  shareSteps: ['RAG: question to cited answer', 'Scope: message to action'],
  shareResult: 'Every step on the page',
} as const;
