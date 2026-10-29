import type { MetadataRoute } from 'next';

import { ALL_PAGES } from '@/content/site';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

// Every page of both products, at its canonical address.
const sitemap = (): MetadataRoute.Sitemap => ALL_PAGES.map((path) => ({ url: `${SITE_URL}${path}` }));

export default sitemap;
