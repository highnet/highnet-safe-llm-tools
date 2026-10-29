import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ClassMark } from '@/components/ui/ClassMark';
import { Typography } from '@/components/ui/Typography';
import { SCOPE_ACTIONS, SCOPE_VERDICT } from '@/content/scope-verdict';
import { formatNumber } from '@/lib/format';
import { scopeRunHref, verdictForQuestion } from '@/lib/scope-verdicts';

type ScopeVerdictNoteProps = {
  questionId: string;
};

// The first step's link to the other product: Scope's recorded verdict on this exact question,
// under its RAG corpus assistant preset, read from the export (never typed in by hand).
const ScopeVerdictNote = ({ questionId }: ScopeVerdictNoteProps) => {
  const verdict = verdictForQuestion(questionId);
  if (!verdict) {
    return (
      <Typography variant="small" color="muted">
        {SCOPE_VERDICT.missing}
      </Typography>
    );
  }
  const action = SCOPE_ACTIONS[verdict.action];
  return (
    <section
      aria-labelledby={`scope-verdict-${questionId}`}
      data-slot="scope-verdict"
      className="space-y-2 border-t border-dashed pt-3"
    >
      <Typography variant="label" color="muted" as="h4" id={`scope-verdict-${questionId}`}>
        {SCOPE_VERDICT.title}
      </Typography>
      <Typography variant="small">{SCOPE_VERDICT.lede}</Typography>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{SCOPE_VERDICT.action}</dt>
        <dd className="voice-data flex items-center gap-2 font-semibold">
          <ClassMark label={action.label} />
          {action.text}
        </dd>
        <dt className="text-muted-foreground">{SCOPE_VERDICT.confidence}</dt>
        <dd className="voice-data">{formatNumber(verdict.confidence, 2)}</dd>
        <dt className="text-muted-foreground">{SCOPE_VERDICT.judge}</dt>
        <dd className="voice-data">
          {verdict.judge
            ? `${verdict.judge.label} (${formatNumber(verdict.judge.confidence, 2)})`
            : SCOPE_VERDICT.judgeFailed}
        </dd>
        {verdict.decide && (
          <>
            <dt className="text-muted-foreground">{SCOPE_VERDICT.decide}</dt>
            <dd className="voice-data">
              {`${verdict.decide.label} (${formatNumber(verdict.decide.confidence, 2)})`}
            </dd>
          </>
        )}
      </dl>
      {verdict.action !== 'redirect' && verdict.action !== 'block' && (
        <Typography variant="small" color="muted">
          {SCOPE_VERDICT.inScopeNotInCorpus}
        </Typography>
      )}
      <Link
        href={scopeRunHref(verdict.example_id)}
        className="voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
      >
        {SCOPE_VERDICT.link}
        <ArrowRight aria-hidden className="size-3.5" />
      </Link>
    </section>
  );
};

export { ScopeVerdictNote };
