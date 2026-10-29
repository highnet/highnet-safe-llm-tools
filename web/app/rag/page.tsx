import type { Metadata } from 'next';

import { PipelineExplorer } from '@/components/pipeline/PipelineExplorer';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SITE } from '@/content/site';
import { pageMetadata, PRODUCT_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/rag/',
  `${SITE.products.rag.name}: ${SITE.products.rag.tagline}`,
  PRODUCT_DESCRIPTION.rag,
  'rag',
);

const RagPage = () => {
  return (
    <>
      <SiteHeader product="rag" current="pipeline" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <PipelineExplorer />
      </main>
      <SiteFooter />
    </>
  );
};

export default RagPage;
