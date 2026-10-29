'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Formula } from '@/components/formal/Formula';
import { Disclosure } from '@/components/ui/Disclosure';
import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import { FORMAL, type KeyEntry } from '@/content/formal';
import type { StageCopy } from '@/content/stages';
import { pad2 } from '@/lib/format';
import type { Snippet } from '@/lib/snippets';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

import { CodeSnippet } from './CodeSnippet';
import { Readout } from './Readout';
import { StatusMark, type StepStatus } from './StatusMark';
import { WhyThisStep } from './WhyThisStep';

const WIDE = '(min-width: 768px)';

type StepSheetProps = {
  // The diagram at the top links here.
  anchor: string;
  // The step as a formula, its symbols explained on tap (see content/formal.ts).
  formula?: string;
  // The symbols the formula explains; the RAG pipeline's by default (Scope passes its own).
  formulaKey?: Record<string, KeyEntry>;
  number: number;
  copy: StageCopy;
  status: StepStatus;
  summary?: string;
  // One plain sentence of what happened in this run, and at most one figure: shown by default.
  lead?: string;
  figure?: ReactNode;
  snippets: Snippet[];
  // Links into the details (such as #chunk-12) open them, so the linked row exists to scroll to.
  opensOn?: RegExp;
  measure?: { ms: number; tokens: number; costUsd: number };
  // Everything else (facts, tables, raw prompts) waits behind the step's one Details toggle.
  children?: ReactNode;
};

const LEAD_TONE: Partial<Record<StepStatus, 'destructive' | 'warning' | 'muted'>> = {
  error: 'destructive',
  warning: 'warning',
  skipped: 'muted',
};

// One numbered step of the calculation: number in the margin, then a sheet that says in one
// sentence what happened, with at most one figure. Everything else (the note, the formula, the
// facts and the code) opens under one Details toggle; from lg the note is written in the margin.
// On phones each step also folds to one line so the page stays short.
const StepSheet = ({
  anchor,
  formula,
  formulaKey,
  number,
  copy,
  status,
  summary,
  lead,
  figure,
  snippets,
  opensOn,
  measure,
  children,
}: StepSheetProps) => {
  const wide = useMediaQuery(WIDE);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    if (!opensOn) return;
    const follow = () => {
      const hash = window.location.hash;
      if (!opensOn.test(hash)) return;
      setOpen(true);
      setDetails(true);
      // The row is drawn on the next frame; then scroll it into view as the link meant.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    };
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, [opensOn]);
  const quiet = status === 'pending' || status === 'skipped';
  const headingId = `step-${number}-title`;

  const readout = measure && status !== 'skipped' && (
    <Readout ms={measure.ms} tokens={measure.tokens} costUsd={measure.costUsd} />
  );
  const formal = formula && (
    <div className="rounded-sm border border-dashed px-3 pt-2 pb-1">
      <Typography variant="label" color="muted" as="p">
        {FORMAL.label}
      </Typography>
      <Formula source={formula} id={`${anchor}-formula`} entries={formulaKey} className="mt-1" />
    </div>
  );
  const body = (
    <div className="space-y-3">
      {lead && (
        <Typography color={LEAD_TONE[status]} className="max-w-[68ch]">
          {lead}
        </Typography>
      )}
      {figure}
      <Disclosure
        show={COPY.details}
        hide={COPY.hideDetails}
        open={details}
        onOpenChange={setDetails}
        className="border-t border-dashed pt-1"
      >
        <div className="space-y-3">
          <WhyThisStep copy={copy} layout="inline" className="lg:hidden" />
          {formal}
          {children}
          <div className="border-t border-dashed pt-2">
            <CodeSnippet snippets={snippets} />
          </div>
        </div>
      </Disclosure>
    </div>
  );

  return (
    <li
      id={anchor}
      aria-labelledby={headingId}
      data-status={status}
      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 md:grid-cols-[3rem_minmax(0,1fr)] md:gap-x-4 lg:grid-cols-[3rem_minmax(0,1fr)_17rem] lg:gap-x-8"
    >
      <span
        aria-hidden
        className={cn(
          'voice-data flex flex-col items-end gap-2 self-stretch pt-3 text-sm md:pt-4 md:text-base',
          status === 'running' ? 'text-primary' : 'text-muted-foreground',
          !quiet && 'animate-write-in [animation-duration:120ms]',
        )}
      >
        {pad2(number)}
        {status === 'running' && <span className="w-0.5 flex-1 bg-primary" />}
      </span>

      {wide ? (
        <article
          className={cn(
            'min-w-0 self-start rounded-md border px-5 py-4',
            quiet
              ? 'border-dashed bg-transparent py-3'
              : 'animate-write-in bg-card [animation-delay:40ms] [animation-duration:140ms] motion-reduce:[animation-delay:0ms]',
            status === 'error' && 'border-destructive',
          )}
        >
          <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Typography
              variant="stepHeading"
              id={headingId}
              className={cn(quiet && 'text-base font-medium text-muted-foreground')}
            >
              {copy.title}
            </Typography>
            <div className="flex items-center gap-3">
              {readout}
              <StatusMark status={status} />
            </div>
          </header>
          {status !== 'pending' && <div className="mt-2">{body}</div>}
        </article>
      ) : (
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          className={cn(
            'min-w-0 self-start rounded-md border',
            quiet ? 'border-dashed bg-transparent' : 'bg-card',
            status === 'error' && 'border-destructive',
          )}
        >
          <CollapsibleTrigger className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-3 py-2 text-left">
            <span className="min-w-0 flex-1">
              <Typography
                variant="stepHeading"
                as="span"
                id={headingId}
                className={cn('block text-base', quiet && 'font-medium text-muted-foreground')}
              >
                {copy.title}
              </Typography>
              {/* Open, the lead sentence below says the same thing in words. */}
              {summary && !open && (
                <span className="voice-data line-clamp-2 block text-xs text-muted-foreground">
                  {summary}
                </span>
              )}
            </span>
            <StatusMark status={status} />
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 shrink-0 text-primary transition-transform',
                open && 'rotate-180',
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 px-3 pb-3">
            {readout}
            {status !== 'pending' && body}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* The note is written in the margin only while the step's details are open. */}
      {wide && status !== 'pending' && details && (
        <WhyThisStep
          copy={copy}
          layout="margin"
          className={cn(
            'hidden lg:block',
            !quiet &&
              'animate-write-in [animation-delay:90ms] [animation-duration:90ms] motion-reduce:[animation-delay:0ms]',
          )}
        />
      )}
    </li>
  );
};

export { StepSheet };
