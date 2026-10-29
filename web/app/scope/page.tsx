import type { Metadata } from 'next';

import { ScopeExplorer } from '@/components/scope/ScopeExplorer';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SITE } from '@/content/site';
import { pageMetadata, PRODUCT_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  '/scope/',
  `${SITE.products.scope.name}: ${SITE.products.scope.tagline}`,
  PRODUCT_DESCRIPTION.scope,
  'scope',
);

const ScopePage = () => {
  return (
    <>
      <SiteHeader product="scope" current="pipeline" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-12">
        <ScopeExplorer />
      </main>
      <SiteFooter />
    </>
  );
};

export default ScopePage;
