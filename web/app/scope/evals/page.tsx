import type { Metadata } from 'next';

import { ScopeEvalsReport } from '@/components/scope/evals/ScopeEvalsReport';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SCOPE } from '@/content/scope';
import { publishedScopeResults } from '@/lib/scope/evals';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/scope/evals/',
  SCOPE.evals.metaTitle,
  SCOPE.evals.metaDescription,
  'scope',
);

const ScopeEvalsPage = () => {
  return (
    <>
      <SiteHeader product="scope" current="evals" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <ScopeEvalsReport results={publishedScopeResults} />
      </main>
      <SiteFooter />
    </>
  );
};

export default ScopeEvalsPage;
