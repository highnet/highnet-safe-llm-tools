// Site-level English copy: the umbrella name, the two products and every page's place in the
// navigation. One list feeds the header, the footer site map and the sitemap.

export type ProductKey = 'rag' | 'scope';

export const SITE = {
  name: 'Highnet Safe LLM Tools',
  tagline: 'Safe LLM systems, worked out step by step.',
  productsLabel: 'Products',
  products: {
    rag: {
      name: 'RAG',
      href: '/rag/',
      tagline: 'Retrieval-augmented generation, worked out step by step.',
    },
    scope: {
      name: 'Scope',
      href: '/scope/',
      tagline: 'Watch an AI agent decide whether a message is in scope, step by step.',
    },
  },
  navLabel: (product: string) => `${product} pages`,
  // Each pipeline page's two views, nested in that product's segment of the header switcher.
  view: {
    label: (product: string) => `${product} view`,
    simple: 'Simple',
    steps: 'Every step',
  },
  pages: {
    rag: [
      { key: 'pipeline', href: '/rag/', text: 'Pipeline' },
      { key: 'corpus', href: '/rag/corpus/', text: 'Corpus' },
      { key: 'evals', href: '/rag/evals/', text: 'Evals' },
      { key: 'coverage', href: '/rag/coverage/', text: 'Coverage' },
    ],
    scope: [
      { key: 'pipeline', href: '/scope/', text: 'Pipeline' },
      { key: 'dataset', href: '/scope/dataset/', text: 'Dataset' },
      { key: 'evals', href: '/scope/evals/', text: 'Evals' },
      { key: 'coverage', href: '/scope/coverage/', text: 'Coverage' },
    ],
  },
  footer: {
    home: 'Overview',
    project: 'Project',
    projectLinks: [
      { href: 'https://github.com/highnet/highnet-safe-llm-tools', text: 'Source on GitHub' },
      { href: 'https://highnet.at', text: 'highnet.at' },
    ],
    corpus: 'Corpus: SQuAD 2.0 dev set (Rajpurkar et al.), Wikipedia text under CC BY-SA 4.0.',
    dataset: 'Scope’s labeled prompts were drafted by Claude and checked by script.',
  },
} as const;

export type SitePage = (typeof SITE.pages)[ProductKey][number]['key'];

// Every page of the site, landing first, for the sitemap.
export const ALL_PAGES: string[] = [
  '/',
  ...SITE.pages.rag.map((p) => p.href),
  ...SITE.pages.scope.map((p) => p.href),
];
