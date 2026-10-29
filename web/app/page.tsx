import type { Metadata } from 'next';

import { Landing } from '@/components/landing/Landing';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { LANDING } from '@/content/landing';
import { pageMetadata, SITE_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = pageMetadata('/', LANDING.metaTitle, SITE_DESCRIPTION);

const HomePage = () => {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-16">
        <Landing />
      </main>
      <SiteFooter />
    </>
  );
};

export default HomePage;
