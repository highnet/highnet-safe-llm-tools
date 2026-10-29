import { ArrowUpRight } from 'lucide-react';

import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';

const P = SCOPE.principles;

// Three convictions behind the guard, written down the pad, not as cards: each claim in
// graphite, its reasoning beside it, ruled lines between.
const Principles = () => {
  return (
    <section aria-labelledby="principles-title" className="space-y-3">
      <div className="border-b pb-2">
        <Typography variant="stepHeading" as="h2" id="principles-title">
          {P.title}
        </Typography>
      </div>
      <ol className="divide-y">
        {P.items.map((item) => (
          <li
            key={item.title}
            className="grid gap-x-8 gap-y-1 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
          >
            <Typography as="h3" className="font-semibold text-balance">
              {item.title}
            </Typography>
            <div className="space-y-2">
              <Typography color="muted">{item.body}</Typography>
              {item.links && (
                <ul className="flex flex-col gap-1">
                  {item.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="voice-pencil inline-flex min-h-8 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
                      >
                        {link.text}
                        <ArrowUpRight aria-hidden className="size-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export { Principles };
