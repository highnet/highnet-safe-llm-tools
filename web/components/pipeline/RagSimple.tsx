import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import { firstSentence, oneLine } from '@/lib/preview';
import type { CitationRef, CitationsData } from '@/lib/stage-data';
import type { RunStatus } from '@/lib/use-trace-stream';

const S = COPY.simple;
// The passages shown under the answer: the first few it cites.
const MAX_SOURCES = 3;

type RagSimpleProps = {
  // The question of the run on screen (null before the first run).
  question: string | null;
  citations: CitationsData | undefined;
  // The answer text as it streams in, before the citations step writes it out.
  streamed: string;
  runStatus: RunStatus;
  onShowSteps: () => void;
};

// The Simple view's one card: the question, the answer in plain prose with its source numbers,
// and the passages it cites (article and one sentence each), read only from the run's trace.
const RagSimple = ({ question, citations, streamed, runStatus, onShowSteps }: RagSimpleProps) => {
  const running = runStatus === 'running';
  if (!question) {
    return <Typography color="muted">{running ? S.working : S.empty}</Typography>;
  }

  const sources = new Map<number, CitationRef>();
  for (const c of citations?.citations ?? []) {
    if (!sources.has(c.rank) && sources.size < MAX_SOURCES) sources.set(c.rank, c);
  }
  const prose = 'max-w-[68ch] text-lg leading-relaxed text-pretty break-words';

  return (
    <div className="space-y-2">
      <div className="min-w-0 space-y-3 rounded-md border border-foreground/70 bg-card px-4 py-4 md:px-6 md:py-5">
        <Typography className="line-clamp-2 break-words">
          <span className="sr-only">{S.question}: </span>
          {oneLine(question, 240)}
        </Typography>
        <div aria-live="polite" className="space-y-3 border-t border-dashed pt-3">
          <Typography as="h3" className="sr-only">
            {S.answer}
          </Typography>
          {citations ? (
            <p className={prose}>
              {citations.blocks.map((block, i) => (
                <span key={i}>
                  {block.text}
                  {block.citation_ids.map((rank) => (
                    <sup key={rank} className="voice-data ml-0.5 text-xs text-primary">
                      <span className="sr-only">({S.source(rank)})</span>
                      <span aria-hidden>{rank}</span>
                    </sup>
                  ))}
                </span>
              ))}
            </p>
          ) : streamed ? (
            <p className={prose}>{streamed}</p>
          ) : (
            <Typography color="muted">{running ? S.working : S.stopped}</Typography>
          )}
          {sources.size > 0 && (
            <div className="space-y-1.5 border-t border-dashed pt-3">
              <Typography variant="label" color="muted" as="h3" id="rag-sources">
                {S.sources}
              </Typography>
              <ol aria-labelledby="rag-sources" className="space-y-2">
                {[...sources.values()].map((s) => (
                  <li key={s.rank} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                    <span className="voice-data text-sm text-primary">{s.rank}</span>
                    <div className="min-w-0">
                      <Typography variant="small" className="font-semibold">
                        {s.doc_title}
                      </Typography>
                      <Typography variant="small" color="muted" className="break-words">
                        {firstSentence(s.cited_text)}
                      </Typography>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
      <Button
        variant="pencil"
        size="inline"
        className="min-h-10 gap-1 text-sm"
        onClick={onShowSteps}
      >
        {S.every}
        <ArrowRight aria-hidden className="size-3.5" />
      </Button>
    </div>
  );
};

export { RagSimple };
