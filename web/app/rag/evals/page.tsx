import type { Metadata } from 'next';

import { EvalsReport } from '@/components/evals/EvalsReport';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { EVALS } from '@/content/evals';
import { publishedResults } from '@/lib/evals';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/rag/evals/',
  EVALS.metaTitle,
  EVALS.metaDescription,
  'rag',
);

const EvalsPage = () => {
  return (
    <>
      <SiteHeader product="rag" current="evals" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <EvalsReport results={publishedResults} />
      </main>
      <SiteFooter />
    </>
  );
};

export default EvalsPage;
