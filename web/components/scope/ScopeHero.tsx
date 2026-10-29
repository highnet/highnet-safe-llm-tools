import { ArrowDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';

const H = SCOPE.hero;

type ScopeHeroProps = {
  diagram: ReactNode;
  // In the Simple view the hero sits below the result, under the page's own plain heading.
  headingAs?: 'h1' | 'h2';
};

// What a scope guard is and what this page shows, beside the whole guard drawn as one figure.
const ScopeHero = ({ diagram, headingAs = 'h1' }: ScopeHeroProps) => {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-start gap-x-12 gap-y-8 pb-4 md:pb-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="space-y-5">
        <Typography variant="display" as={headingAs} id="hero-title">
          {H.title}
        </Typography>
        <dl className="max-w-[68ch]">
          <dt className="flex flex-wrap items-baseline gap-x-2">
            <Typography variant="data" as="dfn" className="text-base font-semibold not-italic">
              {H.term}
            </Typography>
            <Typography variant="small" color="muted" as="span">
              {H.expansion}
            </Typography>
          </dt>
          <dd className="mt-1">
            <Typography>{H.definition}</Typography>
          </dd>
        </dl>
        <Typography color="muted">{H.intro}</Typography>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <a href="#sheet-title" className={buttonVariants({ variant: 'primary' })}>
            {H.action}
            <ArrowDown aria-hidden />
          </a>
          <Link
            href="/scope/dataset/"
            className="voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            {H.dataset}
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
      {diagram}
    </section>
  );
};

export { ScopeHero };
