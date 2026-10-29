import type { Metadata } from 'next';

import { ScopeCoverage } from '@/components/scope/coverage/ScopeCoverage';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SCOPE } from '@/content/scope';
import { publishedScopeResults } from '@/lib/scope/evals';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/scope/coverage/',
  SCOPE.coverage.metaTitle,
  SCOPE.coverage.metaDescription,
  'scope',
);

const ScopeCoveragePage = () => {
  return (
    <>
      <SiteHeader product="scope" current="coverage" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <ScopeCoverage results={publishedScopeResults} />
      </main>
      <SiteFooter />
    </>
  );
};

export default ScopeCoveragePage;
