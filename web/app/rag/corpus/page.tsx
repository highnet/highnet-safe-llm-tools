import type { Metadata } from 'next';

import { CorpusBrowser } from '@/components/corpus/CorpusBrowser';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { CORPUS } from '@/content/corpus';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/rag/corpus/',
  CORPUS.metaTitle,
  CORPUS.metaDescription,
  'rag',
);

const CorpusPage = () => {
  return (
    <>
      <SiteHeader product="rag" current="corpus" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <CorpusBrowser />
      </main>
      <SiteFooter />
    </>
  );
};

export default CorpusPage;
