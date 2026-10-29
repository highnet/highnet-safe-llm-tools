import { ArrowRight } from 'lucide-react';

import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { RespondData } from '@/lib/scope/types';
import { ragHref } from '@/lib/scope/url-state';

import { ActionTag } from '../ClassTag';

const F = SCOPE.steps.respond;

type RespondViewProps = { data: RespondData; message: string };

// The action and what the product says back: the recorded answer under its caps, the preset's
// own redirect or block message, or the hand-off to the RAG pipeline.
const RespondView = ({ data, message }: RespondViewProps) => {
  const preset = data.action === 'redirect' || data.action === 'block';
  return (
    <div className="space-y-3">
      <p className="text-base">
        <ActionTag action={data.action} size="lg" className="font-semibold" />
      </p>
      {data.error && <Typography color="warning">{F.notRecorded}</Typography>}
      {data.handoff === 'rag' && (
        <div className="space-y-2">
          <Typography variant="small">{data.brief ? F.handoffBrief : F.handoff}</Typography>
          <a
            href={ragHref(message)}
            className="voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            {F.openRag}
            <ArrowRight aria-hidden className="size-3.5" />
          </a>
        </div>
      )}
      {data.text !== undefined && (
        <div className="space-y-1">
          <blockquote className="max-h-96 max-w-[72ch] overflow-auto rounded-sm border border-dashed px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
            {data.text}
          </blockquote>
          <Typography variant="data" color="muted" as="p" className="text-xs">
            {preset ? F.presetText : F.caps(data.max_tokens as number, data.max_chars as number)}
          </Typography>
          {data.truncated && (
            <Typography variant="small" color="warning">
              {F.truncated}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
};

export { RespondView };
