import type { Metadata } from 'next';

import { DatasetBrowser } from '@/components/scope/dataset/DatasetBrowser';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SCOPE } from '@/content/scope';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/scope/dataset/',
  SCOPE.dataset.metaTitle,
  SCOPE.dataset.metaDescription,
  'scope',
);

const ScopeDatasetPage = () => {
  return (
    <>
      <SiteHeader product="scope" current="dataset" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <DatasetBrowser />
      </main>
      <SiteFooter />
    </>
  );
};

export default ScopeDatasetPage;
