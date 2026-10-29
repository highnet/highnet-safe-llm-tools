import { ChevronRight } from 'lucide-react';

import { Formula, glyph } from '@/components/formal/Formula';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Typography } from '@/components/ui/Typography';
import { FORMAL, type KeyEntry } from '@/content/formal';
import { SCOPE, SCOPE_KEY } from '@/content/scope';

const F = SCOPE.formal;
const GROUPS: KeyEntry['group'][] = ['table', 'function', 'value'];

// The guard's arithmetic as formulas, folded under the diagram like the RAG pipeline's own.
// The definitions match scope/src/highnet_scope/{rules,knn,fusion}.py.
const ScopeFormulas = () => {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group voice-pencil inline-flex min-h-10 cursor-pointer items-center gap-1 text-left text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid">
        <ChevronRight
          aria-hidden
          className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-90"
        />
        {F.title}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        <Typography variant="small" color="muted" className="max-w-[68ch]">
          {F.intro}
        </Typography>
        <dl className="space-y-3">
          {F.lines.map((line, i) => (
            <div key={line.label} className="rounded-sm border border-dashed px-3 pt-2 pb-1">
              <Typography variant="label" color="muted" as="dt">
                {line.label}
              </Typography>
              <dd>
                <Formula
                  id={`scope-formula-${i}`}
                  source={line.source}
                  entries={SCOPE_KEY}
                  hint={FORMAL.hint}
                  className="mt-1"
                />
              </dd>
            </div>
          ))}
        </dl>
        {GROUPS.map((group) => (
          <div key={group}>
            <Typography variant="label" color="muted" as="h3">
              {FORMAL.groups[group]}
            </Typography>
            <dl className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {Object.entries(SCOPE_KEY)
                .filter(([, entry]) => entry.group === group)
                .map(([symbol, entry]) => (
                  <div
                    key={symbol}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-2 rounded-sm border bg-card px-2.5 py-1.5 text-xs"
                  >
                    <dt className="voice-data min-w-6 text-sm whitespace-nowrap text-primary">
                      {glyph(symbol)}
                    </dt>
                    <dd>
                      <span className="font-semibold">{entry.name}</span>
                      <span className="text-muted-foreground">: {entry.meaning}</span>
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export { ScopeFormulas };
