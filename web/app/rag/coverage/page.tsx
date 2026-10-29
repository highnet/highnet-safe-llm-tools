import type { Metadata } from 'next';

import { CoverageReport } from '@/components/coverage/CoverageReport';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { COVERAGE } from '@/content/coverage';
import { committedCoverage } from '@/lib/coverage';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/rag/coverage/',
  COVERAGE.metaTitle,
  COVERAGE.metaDescription,
  'rag',
);

const CoveragePage = () => {
  return (
    <>
      <SiteHeader product="rag" current="coverage" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <CoverageReport report={committedCoverage} />
      </main>
      <SiteFooter />
    </>
  );
};

export default CoveragePage;
