import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { SCOPE_ACTIONS } from '@/content/scope-verdict';
import type { Example } from '@/lib/scope/types';
import { ragHref } from '@/lib/scope/url-state';
import { type ScopeVerdict, verdictForExample } from '@/lib/scope-verdicts';

const B = SCOPE.bridge;
export const NOT_IN_CORPUS = 'rag-world-cup';
export const OFF_SCOPE = 'rag-lasagna';

// What the recorded default run decided for the World Cup question, from the exported verdicts.
export const bridgeNote = (verdict: ScopeVerdict | undefined) => {
  if (!verdict) return null;
  const action = SCOPE_ACTIONS[verdict.action].text;
  if (!verdict.judge) return B.notInCorpus.verdictNoJudge(action);
  const judge = SCOPE.labels[verdict.judge.label as keyof typeof SCOPE.labels];
  return verdict.judge.label === 'in'
    ? B.notInCorpus.verdictAgree(action, judge)
    : B.notInCorpus.verdict(action, judge);
};

type RagBridgeProps = {
  examples: Example[];
  disabled: boolean;
  onPick: (example: Example) => void;
};

const linkClass =
  'voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid';

// Under the RAG corpus assistant preset: why "in scope" is not "answerable", next to off scope.
const RagBridge = ({ examples, disabled, onPick }: RagBridgeProps) => {
  const worldCup = examples.find((e) => e.id === NOT_IN_CORPUS);
  const lasagna = examples.find((e) => e.id === OFF_SCOPE);
  const items = [
    worldCup && {
      example: worldCup,
      copy: B.notInCorpus,
      note: bridgeNote(verdictForExample(worldCup.id)),
      rag: true,
    },
    lasagna && { example: lasagna, copy: B.offScope, note: null, rag: false },
  ].filter((item) => !!item);
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="bridge-title"
      className="space-y-2 rounded-md border bg-card px-4 py-4 md:px-5"
    >
      <Typography variant="stepHeading" as="h2" id="bridge-title" className="text-base">
        {B.title}
      </Typography>
      <Typography variant="small" color="muted" className="max-w-[68ch]">
        {B.intro}
      </Typography>
      <ul className="divide-y divide-dashed">
        {items.map(({ example, copy, note, rag }) => (
          <li key={example.id} className="space-y-1 py-3 last:pb-0">
            <Typography variant="small">
              <span className="font-semibold">{copy.title}</span> {copy.body}
            </Typography>
            <p className="voice-data text-sm">“{example.text}”</p>
            {note && <Typography variant="marginNote">{note}</Typography>}
            <div className="flex flex-wrap items-center gap-x-5">
              <Button
                type="button"
                variant="pencil"
                size="inline"
                disabled={disabled}
                className="min-h-10 text-sm"
                onClick={() => onPick(example)}
              >
                {copy.replay}
              </Button>
              {rag && (
                <a href={ragHref(example.text)} className={linkClass}>
                  {B.notInCorpus.link}
                  <ArrowRight aria-hidden className="size-3.5" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export { RagBridge };
