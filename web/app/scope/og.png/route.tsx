import { SCOPE } from '@/content/scope';
import { SCOPE_STAGE_ORDER, SCOPE_STAGES } from '@/content/scope-stages';
import { SITE } from '@/content/site';
import { shareCard } from '@/lib/share-card';

export const dynamic = 'force-static';

// Scope's share card (/scope/og.png): its tagline and its twelve steps, ending in the four actions.
export const GET = () =>
  shareCard({
    name: `${SITE.name} · ${SITE.products.scope.name}`,
    headline: SITE.products.scope.tagline,
    steps: SCOPE_STAGE_ORDER.map((stage) => SCOPE_STAGES[stage].title),
    result: SCOPE.share.result,
    compact: true,
  });
