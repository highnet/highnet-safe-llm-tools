import { type ReactNode } from 'react';

import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { type AuditData, SIGNALS } from '@/lib/scope/types';

import { ActionTag, ClassTag } from '../ClassTag';

const F = SCOPE.steps.audit;

type AuditViewProps = { data: AuditData };

// The record a reviewer would see, field by field.
const AuditView = ({ data }: AuditViewProps) => {
  const { record } = data;
  const signals = SIGNALS.filter((s) => record.signals[s]);
  const rows: [string, ReactNode][] = [
    [F.heads.action, <ActionTag key="a" action={record.action} />],
    [F.heads.label, <ClassTag key="l" label={record.label} />],
    [F.heads.confidence, record.confidence.toFixed(3)],
    [F.heads.scope, record.scope_score.toFixed(3)],
    [
      F.heads.signals,
      signals.length ? (
        <span key="s" className="flex flex-wrap gap-x-3">
          {signals.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              {SCOPE.signals[s]}
              <ClassTag label={record.signals[s]!} short />
            </span>
          ))}
        </span>
      ) : (
        F.none
      ),
    ],
    [F.heads.rules, record.rule_hits.join(', ') || F.none],
    [F.heads.relabelled, record.relabelled_topics.join(', ') || F.none],
    [F.heads.rubric, record.rubric],
    [
      F.heads.hash,
      <span key="h" className="break-all">
        {record.message_sha256}
      </span>,
    ],
  ];
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="voice-data min-w-0">{value}</dd>
          </div>
        ))}
      </dl>
      <Typography variant="small" color={record.needs_review ? 'warning' : 'muted'}>
        {record.needs_review ? F.reviewReasons(data.review_reasons.join(', ')) : F.noReview}
      </Typography>
      <Typography variant="small" color="muted">
        {F.notStored}
      </Typography>
    </div>
  );
};

export { AuditView };
