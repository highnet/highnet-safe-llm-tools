import { LANDING } from '@/content/landing';
import { SITE } from '@/content/site';
import { shareCard } from '@/lib/share-card';

export const dynamic = 'force-static';

// The site's share card (/og.png): the umbrella name, its tagline and the two products.
export const GET = () =>
  shareCard({
    name: SITE.name,
    headline: SITE.tagline,
    steps: LANDING.shareSteps,
    result: LANDING.shareResult,
  });
