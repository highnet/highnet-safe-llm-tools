import type { Metadata } from 'next';

import { type ProductKey, SITE } from '@/content/site';

// The public address of the site, for canonical links, the sitemap and share cards.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://highnet-safe-llm-tools.vercel.app';
export const REPO_URL = 'https://github.com/highnet/highnet-safe-llm-tools';

export const SITE_DESCRIPTION =
  'Two transparent teaching tools for safe LLM systems: the RAG pipeline, from search to cited answer, and Scope, an agent deciding whether a message is in scope. Every step is shown with its real scores, tokens, timing and cost.';

export const PRODUCT_DESCRIPTION: Record<ProductKey, string> = {
  rag: 'The RAG pipeline laid open: every step between a question and its cited answer, from search to citations, with real scores, tokens, timing and cost.',
  scope:
    'Scope: watch an AI agent decide whether a message is in scope, step by step. Rules, nearest neighbours and an LLM judge, fused into answer, answer briefly, redirect or block.',
};

// Each product has its own share card, drawn at build time (app/**/og.png/route.tsx).
export const shareImage = (product?: ProductKey) => ({
  url: product ? `/${product}/og.png` : '/og.png',
  width: 1200,
  height: 630,
  alt: product ? `${SITE.name}: ${SITE.products[product].tagline}` : `${SITE.name}: ${SITE.tagline}`,
});

// Metadata for one page: its title and description, its canonical address, and the same words
// on the share card.
export const pageMetadata = (
  path: string,
  title: string,
  description: string,
  product?: ProductKey,
): Metadata => {
  const fullTitle = path === '/' ? title : `${title} · ${SITE.name}`;
  const images = [shareImage(product)];
  return {
    title: path === '/' ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      locale: 'en',
      url: path,
      title: fullTitle,
      description,
      images,
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images },
  };
};

// Structured data for search engines: the site, its two products, who made them and where the
// source lives.
export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE.name,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      author: { '@id': 'https://highnet.at/#author' },
    },
    {
      '@type': 'Person',
      '@id': 'https://highnet.at/#author',
      name: 'highnet',
      url: 'https://highnet.at',
    },
    ...(['rag', 'scope'] as const).map((product) => ({
      '@type': 'WebApplication',
      '@id': `${SITE_URL}${SITE.products[product].href}#app`,
      name: `${SITE.name}: ${SITE.products[product].name}`,
      url: `${SITE_URL}${SITE.products[product].href}`,
      description: PRODUCT_DESCRIPTION[product],
      applicationCategory: 'EducationalApplication',
      isPartOf: { '@id': `${SITE_URL}/#website` },
    })),
    {
      '@type': 'SoftwareSourceCode',
      name: SITE.name,
      description: SITE_DESCRIPTION,
      codeRepository: REPO_URL,
      programmingLanguage: ['Python', 'TypeScript'],
      author: { '@id': 'https://highnet.at/#author' },
    },
  ],
};
