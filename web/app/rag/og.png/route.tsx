import { COPY } from '@/content/copy';
import { SITE } from '@/content/site';
import { STAGE_ORDER, STAGES } from '@/content/stages';
import { shareCard } from '@/lib/share-card';

export const dynamic = 'force-static';

// RAG's share card (/rag/og.png): the hero's headline and the real pipeline steps.
export const GET = () =>
  shareCard({
    name: `${SITE.name} · ${SITE.products.rag.name}`,
    headline: COPY.hero.title,
    steps: STAGE_ORDER.map((stage) => STAGES[stage].title),
    result: COPY.diagram.answer,
  });
