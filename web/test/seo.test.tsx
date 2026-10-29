import { describe, expect, it } from 'vitest';

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { ALL_PAGES, SITE } from '@/content/site';
import { pageMetadata, shareImage, SITE_URL, structuredData } from '@/lib/site';

describe('search and sharing', () => {
  it('gives each page its title, canonical address and its product’s share card', () => {
    const home = pageMetadata('/', 'Home title', 'About the site');
    expect(home.title).toEqual({ absolute: 'Home title' });
    expect(home.alternates?.canonical).toBe('/');
    expect(home.openGraph).toMatchObject({ images: [shareImage()] });
    expect(shareImage().url).toBe('/og.png');
    const evals = pageMetadata('/rag/evals/', 'Evals', 'How well it works', 'rag');
    expect(evals.title).toBe('Evals');
    expect(evals.openGraph).toMatchObject({
      url: '/rag/evals/',
      title: `Evals · ${SITE.name}`,
      images: [shareImage('rag')],
    });
    expect(evals.twitter).toMatchObject({
      card: 'summary_large_image',
      images: [{ url: '/rag/og.png' }],
    });
    expect(shareImage('scope').alt).toContain(SITE.products.scope.tagline);
  });

  it('lists every page of both products in the sitemap and points robots at it', () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(ALL_PAGES.map((path) => `${SITE_URL}${path}`));
    expect(urls).toContain(`${SITE_URL}/scope/dataset/`);
    expect(urls).toContain(`${SITE_URL}/rag/corpus/`);
    expect(robots()).toMatchObject({ sitemap: `${SITE_URL}/sitemap.xml` });
  });

  it('describes the site, both products and the source as structured data', () => {
    const types = structuredData['@graph'].map((node) => node['@type']);
    expect(types).toEqual([
      'WebSite',
      'Person',
      'WebApplication',
      'WebApplication',
      'SoftwareSourceCode',
    ]);
  });
});
