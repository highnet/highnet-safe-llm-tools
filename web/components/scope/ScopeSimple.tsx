import { ArrowRight } from 'lucide-react';

import { Bar } from '@/components/pipeline/figures/Bar';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import {
  type ContextData,
  type Distribution,
  type FuseData,
  type Label,
  type RequestData,
  type RespondData,
  type Signal,
  SIGNALS,
  type ThresholdsData,
} from '@/lib/scope/types';
import { ragHref } from '@/lib/scope/url-state';
import type { RunStatus } from '@/lib/use-trace-stream';

import { ActionTag, ClassTag } from './ClassTag';
import { Turns } from './steps/ContextView';

const S = SCOPE.simple;

// Each advisor's lean: the class with the largest share, and that share.
const lean = (d: Distribution): [Label, number] => {
  const top = (Object.keys(d) as Label[]).reduce((a, b) => (d[b] > d[a] ? b : a));
  return [top, d[top]];
};

type Vote =
  { kind: 'lean'; label: Label; share: number } | { kind: 'none'; text: string; failed: boolean };

// One advisor's row from its own trace event, in plain words.
const voteOf = (
  event: ScopeTraceEvent | undefined,
  on: boolean | undefined,
  pending: boolean,
): Vote => {
  if (!event)
    return { kind: 'none', text: pending ? S.notRun.waiting : S.notRun.other, failed: false };
  const data = event.data as {
    distribution?: Distribution | null;
    relabelled_topics?: string[];
    abstained?: boolean;
    error?: { type: string };
  };
  if (event.status === 'error') {
    const missing = data.error?.type === 'NotRecordedError';
    return { kind: 'none', text: missing ? S.notRun.notRecorded : S.notRun.failed, failed: true };
  }
  if (event.status === 'skipped') {
    const text =
      on === false ? S.notRun.off : data.relabelled_topics ? S.notRun.edited : S.notRun.other;
    return { kind: 'none', text, failed: false };
  }
  if (!data.distribution) return { kind: 'none', text: S.notRun.abstained, failed: false };
  const [label, share] = lean(data.distribution);
  return { kind: 'lean', label, share };
};

type PlainTagProps = { label: Label; className?: string };

// A class as its shape plus an everyday word.
const PlainTag = ({ label, className }: PlainTagProps) => (
  <ClassTag label={label} text={S.labels[label]} size="default" className={className} />
);

type ScopeSimpleProps = {
  events: ScopeTraceEvent[];
  runStatus: RunStatus;
  // Which advisors the run on screen had switched on (null before the first run).
  signals: Record<Signal, boolean> | null;
  onShowSteps: () => void;
};

// The Simple view: the run on screen in plain words, read only from its trace.
const ScopeSimple = ({ events, runStatus, signals, onShowSteps }: ScopeSimpleProps) => {
  const byStage = new Map(events.map((e) => [e.stage, e]));
  const request = byStage.get('request');
  const context = byStage.get('context');
  const fuse = byStage.get('fuse')?.data as FuseData | undefined;
  const decision = byStage.get('thresholds')?.data as ThresholdsData | undefined;
  const respond = byStage.get('respond')?.data as RespondData | undefined;
  const running = runStatus === 'running';
  const requestData = request?.data as RequestData | undefined;

  const showSteps = (
    <Button variant="pencil" size="inline" className="min-h-10 gap-1 text-sm" onClick={onShowSteps}>
      {S.every}
      <ArrowRight aria-hidden className="size-3.5" />
    </Button>
  );

  if (!requestData) {
    return (
      <div className="space-y-3">
        <Typography color="muted">{running ? S.deciding : S.empty}</Typography>
      </div>
    );
  }

  const ran = fuse ? Object.keys(fuse.used_weights).length : 0;

  return (
    <div className="space-y-3">
      <div className="min-w-0 space-y-6 rounded-md border bg-card px-4 py-4 md:px-6 md:py-5">
        <section aria-labelledby="simple-message" className="space-y-2">
          <Typography variant="label" color="muted" as="h3" id="simple-message">
            {S.message}
          </Typography>
          {context?.status === 'ok' && (
            <div className="space-y-1">
              <Typography variant="small" color="muted">
                {S.earlier}
              </Typography>
              <Turns turns={(context.data as ContextData).turns} muted />
            </div>
          )}
          <Typography className="text-lg break-words">{requestData.message}</Typography>
          {requestData.error && (
            <Typography variant="small" color="destructive">
              {requestData.error.message}
            </Typography>
          )}
        </section>

        {!requestData.error && (
          <>
            <section
              aria-labelledby="simple-outcome"
              aria-live="polite"
              className="space-y-2 border-t border-dashed pt-4"
            >
              <Typography variant="label" color="muted" as="h3" id="simple-outcome">
                {S.outcome}
              </Typography>
              {decision ? (
                <>
                  <p className="text-2xl font-semibold">
                    <ActionTag action={decision.action} size="lg" />
                  </p>
                  <Typography className="text-lg">{S.outcomes[decision.action]}</Typography>
                </>
              ) : (
                <Typography color="muted">{running ? S.deciding : S.stopped}</Typography>
              )}
            </section>

            <section
              aria-labelledby="simple-voters"
              className="space-y-2 border-t border-dashed pt-4"
            >
              <Typography variant="label" color="muted" as="h3" id="simple-voters">
                {S.voters}
              </Typography>
              <Typography variant="small" color="muted" className="max-w-[60ch]">
                {S.votersNote}
              </Typography>
              <ul className="divide-y divide-dashed border-t border-dashed">
                {SIGNALS.map((s) => {
                  const vote = voteOf(byStage.get(s), signals?.[s], running);
                  return (
                    <li
                      key={s}
                      className="grid gap-x-6 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]"
                    >
                      <div className="min-w-0">
                        <Typography as="p" className="font-semibold">
                          {S.advisors[s]}
                        </Typography>
                        <Typography variant="small" color="muted">
                          {S.advisorHelp[s]}
                        </Typography>
                      </div>
                      {vote.kind === 'lean' ? (
                        <div className="min-w-0 space-y-1.5 self-center">
                          <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                            <PlainTag label={vote.label} />
                            <span className="voice-data text-sm">
                              {S.sure(SCOPE.pct(vote.share, 0))}
                            </span>
                          </p>
                          <div aria-hidden>
                            <Bar
                              max={1}
                              size="sm"
                              segments={[{ key: 'sure', value: vote.share, tone: 'ink' }]}
                            />
                          </div>
                        </div>
                      ) : (
                        <Typography
                          variant="small"
                          color={vote.failed ? 'destructive' : 'muted'}
                          className="self-center"
                        >
                          {vote.text}
                        </Typography>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {fuse && (
              <section
                aria-labelledby="simple-combined"
                className="space-y-2 border-t border-dashed pt-4"
              >
                <Typography variant="label" color="muted" as="h3" id="simple-combined">
                  {S.combinedTitle}
                </Typography>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <PlainTag label={fuse.label} className="font-semibold" />
                  <span className="voice-data text-sm">
                    {S.sure(SCOPE.pct(fuse.confidence, 0))}
                  </span>
                </p>
                <Typography variant="small" color="muted" className="max-w-[60ch]">
                  {S.combined(S.votes(ran), SCOPE.pct(fuse.confidence, 0))}
                </Typography>
              </section>
            )}

            {respond && (
              <section
                aria-labelledby="simple-reply"
                className="space-y-2 border-t border-dashed pt-4"
              >
                <Typography variant="label" color="muted" as="h3" id="simple-reply">
                  {S.reply}
                </Typography>
                {respond.handoff === 'rag' ? (
                  <div className="space-y-1">
                    <Typography>{respond.brief ? S.handoffBrief : S.handoff}</Typography>
                    <a
                      href={ragHref(requestData.message)}
                      className="voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
                    >
                      {S.openRag}
                      <ArrowRight aria-hidden className="size-3.5" />
                    </a>
                  </div>
                ) : respond.text !== undefined ? (
                  <blockquote className="max-h-96 max-w-[68ch] overflow-auto rounded-sm border border-dashed px-3 py-2 leading-relaxed break-words whitespace-pre-wrap">
                    {respond.text}
                  </blockquote>
                ) : (
                  <Typography color="muted">{S.noReply}</Typography>
                )}
              </section>
            )}
          </>
        )}
      </div>
      {showSteps}
    </div>
  );
};

export { ScopeSimple };
