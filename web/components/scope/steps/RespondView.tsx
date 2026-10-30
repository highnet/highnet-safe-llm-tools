import { ArrowRight } from 'lucide-react';

import { Markdown } from '@/components/ui/Markdown';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { RespondData } from '@/lib/scope/types';
import { ragHref } from '@/lib/scope/url-state';

import { ActionTag } from '../ClassTag';

const F = SCOPE.steps.respond;

type RespondViewProps = { data: RespondData; message: string };

// The step's figure, shown without opening Details: the action, and what the product says back
// (the recorded answer rendered as the reader would see it, the preset's own redirect or block
// message, or the hand-off to the RAG pipeline).
const RespondFigure = ({ data, message }: RespondViewProps) => {
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
        <blockquote className="max-h-96 max-w-[72ch] overflow-auto rounded-sm border border-dashed px-3 py-2 text-sm leading-relaxed">
          <Markdown source={data.text} />
        </blockquote>
      )}
    </div>
  );
};

type RespondDetailsProps = { data: RespondData };

// Behind Details: the hard caps the answer was held to, and whether it was cut.
const RespondView = ({ data }: RespondDetailsProps) => {
  if (data.text === undefined) return null;
  const preset = data.action === 'redirect' || data.action === 'block';
  return (
    <div className="space-y-1">
      <Typography variant="data" color="muted" as="p" className="text-xs">
        {preset ? F.presetText : F.caps(data.max_tokens as number, data.max_chars as number)}
      </Typography>
      {data.truncated && (
        <Typography variant="small" color="warning">
          {F.truncated}
        </Typography>
      )}
    </div>
  );
};

export { RespondFigure, RespondView };
