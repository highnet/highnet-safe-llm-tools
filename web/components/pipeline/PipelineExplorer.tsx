'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Notice } from '@/components/site/Notice';
import { PickCards } from '@/components/site/PickCards';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import { AGENT_STAGE_ORDER, STAGE_ORDER, STAGES } from '@/content/stages';
import { type ApiConfig, type DemoQuestion, fetchConfig } from '@/lib/api';
import { runEvalsHref } from '@/lib/evals';
import { formatMs, formatUsd } from '@/lib/format';
import { oneLine } from '@/lib/preview';
import type { TraceEvent } from '@/lib/generated/trace';
import type {
  Bm25Data,
  CitationsData,
  ContextChunk,
  ContextData,
  RequestData,
  VectorData,
} from '@/lib/stage-data';
import { stepStatuses } from '@/lib/step-status';
import { useTraceStream } from '@/lib/use-trace-stream';
import { parseUrlState, type RunSettings, writeUrlState } from '@/lib/url-state';
import { getView, useView, useViewLink } from '@/lib/view-store';

import { AnswerResult } from './AnswerResult';
import { PipelineDiagram } from './PipelineDiagram';
import { PipelineHero } from './PipelineHero';
import { QuestionForm } from './QuestionForm';
import { QuestionPicker } from './QuestionPicker';
import { RagSimple } from './RagSimple';
import { SettingsStrip } from './SettingsStrip';
import { StepList } from './StepList';

type ConfigState =
  | { status: 'loading' }
  | { status: 'ready'; config: ApiConfig }
  | { status: 'error'; message: string };

const PipelineExplorer = () => {
  const [configState, setConfigState] = useState<ConfigState>({ status: 'loading' });
  const [settings, setSettings] = useState<RunSettings | null>(null);
  const [linkedQuestion, setLinkedQuestion] = useState('');
  const trace = useTraceStream();
  const { run } = trace;
  // The view is shared with the header's toggle (lib/view-store.ts); this page owns the link.
  const simple = useView() === 'simple';
  // Opens every step and scrolls to the working once it is drawn ("See every step").
  const switchTo = useViewLink();

  // State is only set from the fetch callbacks, never synchronously inside the effect.
  // Settings come from the link when it carries valid ones; a linked question runs at once. With
  // none linked, the Simple view replays the first recorded question (free), so it never opens
  // empty; the link stays as it was until the visitor picks one.
  const requestConfig = useCallback(
    (signal?: AbortSignal) => {
      fetchConfig(signal)
        .then((config) => {
          const linked = parseUrlState(window.location.search, config);
          const { q, ...linkedSettings } = linked;
          setConfigState({ status: 'ready', config });
          setSettings(linkedSettings);
          setLinkedQuestion(q);
          if (!q) {
            const first = config.questions[0];
            if (!config.live && first && getView() === 'simple') {
              run({
                q: first.question,
                questionId: first.id,
                ...linkedSettings,
                agentic: linkedSettings.agentic && first.compound,
              });
            }
            return;
          }
          if (config.live) {
            if (config.budget.tier !== 'stopped') run({ q, ...linkedSettings });
            return;
          }
          // A replay costs nothing, so the budget never blocks it; the link names the question.
          const picked = config.questions.find((x) => x.question === q);
          if (picked) {
            run({
              q,
              questionId: picked.id,
              ...linkedSettings,
              agentic: linkedSettings.agentic && picked.compound,
            });
          }
        })
        .catch((error: unknown) => {
          if (signal?.aborted) return;
          setConfigState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        });
    },
    [run],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestConfig(controller.signal);
    return () => controller.abort();
  }, [requestConfig]);

  const retryConfig = () => {
    setConfigState({ status: 'loading' });
    requestConfig();
  };

  const context = useMemo(() => {
    // Top-level steps only: an agent's nested searches have their own bm25 and vector events.
    const byStage = new Map(trace.events.filter((e) => !e.parent).map((e) => [e.stage, e]));
    const contextData = byStage.get('select_context')?.data as ContextData | undefined;
    const citations = byStage.get('citations')?.data as CitationsData | undefined;
    const chunks = new Map<number, ContextChunk>(
      (contextData?.chunks ?? []).map((c) => [c.chunk_id, c]),
    );
    const cited = new Set((citations?.citations ?? []).map((c) => c.chunk_id));
    // Fusion shows its two input rankings, so it needs the search steps' results too.
    const ok = (stage: string) => {
      const event = byStage.get(stage as TraceEvent['stage']);
      return event && event.status !== 'skipped' && event.status !== 'error'
        ? event.data
        : undefined;
    };
    return {
      chunks,
      cited,
      citations,
      streamedAnswer: trace.answer,
      bm25: ok('bm25') as Bm25Data | undefined,
      vector: ok('vector') as VectorData | undefined,
      chunkSet: (byStage.get('request')?.data as RequestData | undefined)?.settings?.chunk_set,
      questionId: trace.input?.questionId,
    };
  }, [trace.events, trace.answer, trace.input]);

  const lastEvent = trace.events.at(-1);
  const announcement = lastEvent
    ? COPY.announce(
        lastEvent.label,
        STAGES[lastEvent.stage].title,
        COPY.status[lastEvent.status],
        formatMs(lastEvent.ms),
      )
    : '';

  const config = configState.status === 'ready' ? configState.config : null;
  const tier = config?.budget.tier ?? 'normal';
  const running = trace.status === 'running';
  // Replay: visitors pick a recorded question and see its recorded run for their settings.
  const replay = config !== null && !config.live;
  const shownQuestion = trace.input?.q ?? linkedQuestion;
  const selected = replay
    ? (config.questions.find((x) => x.question === shownQuestion) ?? null)
    : null;
  // The agent runs live only while the budget allows, and was recorded for compound questions.
  const agentPause = replay
    ? selected?.compound
      ? null
      : { reason: COPY.replay.agentNeedsCompound, warning: false }
    : tier === 'normal'
      ? null
      : { reason: COPY.settings.agentDescription.paused, warning: true };
  // The steps drawn follow the run on screen, or the settings before the first run.
  const agentOn = settings?.agentic === true && agentPause === null;
  const agentView = trace.input ? trace.input.agentic : agentOn;
  const order = agentView ? AGENT_STAGE_ORDER : STAGE_ORDER;

  const runQuestion = (q: string) => {
    if (!settings) return; // the form is disabled until the API has answered
    writeUrlState({ q, ...settings });
    // A paused agent is not asked for: the run on screen is the one the server will do.
    run({ q, ...settings, agentic: settings.agentic && tier === 'normal' });
  };

  const replayQuestion = (question: DemoQuestion, next: RunSettings) => {
    writeUrlState({ q: question.question, ...next });
    run({
      q: question.question,
      questionId: question.id,
      ...next,
      agentic: next.agentic && question.compound,
    });
  };

  const changeSettings = (next: RunSettings) => {
    setSettings(next);
    writeUrlState({ q: trace.input?.q ?? '', ...next });
    // A recorded run exists for every setting, so a change replays at once.
    if (selected) replayQuestion(selected, next);
  };

  const ran = trace.input;
  const stale =
    !replay &&
    ran !== null &&
    settings !== null &&
    (ran.mode !== settings.mode ||
      ran.k !== settings.k ||
      ran.chunkSet !== settings.chunkSet ||
      ran.rerank !== settings.rerank ||
      ran.agentic !== settings.agentic);

  const configNotices = (
    <>
      {configState.status === 'loading' && <Notice tone="note">{COPY.starting}</Notice>}
      {configState.status === 'error' && (
        <Notice tone="error">
          <p>
            {COPY.offline} {configState.message}
          </p>
          <Button variant="pencil" size="inline" className="mt-1" onClick={retryConfig}>
            {COPY.retry}
          </Button>
        </Notice>
      )}
    </>
  );

  // A live server's budget: the page says plainly when it runs low or out.
  const budgetNotices = !replay && config && (
    <>
      {tier === 'degraded' && (
        <Notice tone="warning">
          {COPY.budgetDegraded(
            formatUsd(config.budget.spent_usd),
            formatUsd(config.budget.cap_usd),
          )}
        </Notice>
      )}
      {tier === 'stopped' && (
        <Notice tone="error">{COPY.budgetStopped(formatUsd(config.budget.cap_usd))}</Notice>
      )}
    </>
  );

  const questionForm = (
    <QuestionForm
      key={linkedQuestion}
      initialQuestion={linkedQuestion}
      running={running}
      disabled={!config || tier === 'stopped'}
      maxLength={config?.max_query_chars ?? 500}
      suggestions={agentOn ? COPY.agentSuggestions : COPY.suggestions}
      suggestionsLabel={agentOn ? COPY.agentTryLabel : COPY.tryLabel}
      lastNote={agentOn ? undefined : COPY.suggestionNote}
      onRun={runQuestion}
      onStop={trace.cancel}
    />
  );

  const connectionError = trace.connectionError && (
    <Notice tone="warning">{trace.connectionError}</Notice>
  );

  const announcer = (
    <p aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  // Simple: a one-line heading, the recorded questions as cards, then one answer card.
  if (simple) {
    const items = (config?.questions ?? []).map((x) => ({ id: x.id, text: oneLine(x.question) }));
    return (
      <div className="space-y-6">
        <section aria-labelledby="sheet-title" className="space-y-4">
          <Typography variant="sheetTitle" as="h1" id="sheet-title">
            {COPY.simple.title}
          </Typography>
          {configNotices}
          {config?.illustrative && !replay && <Notice tone="note">{COPY.illustrative}</Notice>}
          {budgetNotices}
          {replay && settings ? (
            <PickCards
              label={COPY.simple.pick}
              featured={items.slice(0, 4)}
              more={items.slice(4)}
              selectedId={selected?.id ?? null}
              empty={COPY.replay.empty}
              moreLabel={COPY.simple.more}
              fewerLabel={COPY.simple.fewer}
              onPick={(id) =>
                replayQuestion(
                  config.questions.find((x) => x.id === id)!,
                  settings,
                )
              }
            />
          ) : (
            config && !replay && questionForm
          )}
          {connectionError}
        </section>

        <section id="rag-answer" aria-labelledby="answer-title" className="scroll-mt-6 space-y-3">
          <Typography variant="label" as="h2" id="answer-title" className="sr-only">
            {COPY.resultLabel}
          </Typography>
          <RagSimple
            question={trace.input?.q ?? null}
            citations={context.citations}
            streamed={trace.answer}
            runStatus={trace.status}
            onShowSteps={() => switchTo('rag-working')}
          />
          {replay && (
            <Typography variant="small" color="muted">
              {config.illustrative ? COPY.simple.illustrative : COPY.simple.recorded}
            </Typography>
          )}
        </section>
        {announcer}
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PipelineHero
        intro={
          replay
            ? config.illustrative
              ? COPY.replay.introIllustrative
              : COPY.replay.intro
            : COPY.intro
        }
        diagram={
          <PipelineDiagram
            order={order}
            statusOf={stepStatuses(order, trace.events, trace.status)}
            className="rounded-md border border-solid px-4 md:px-5"
          />
        }
      />
      <section aria-labelledby="sheet-title" className="space-y-4 md:space-y-5">
        <Typography variant="sheetTitle" as="h2" id="sheet-title">
          <span className="voice-data mr-3 align-[0.2em] text-sm font-normal tracking-normal text-muted-foreground">
            {COPY.sheetLabel} ·
          </span>
          {trace.input?.q ?? COPY.emptyTitle}
        </Typography>

        {configNotices}
        {config?.illustrative && !replay && <Notice tone="note">{COPY.illustrative}</Notice>}
        {replay && (
          <Notice tone="note">
            {/* Only a server with real providers recorded with real models; say which. */}
            {config.illustrative
              ? COPY.replay.noticeIllustrative
              : config.recorded.at
                ? COPY.replay.notice(config.recorded.at.slice(0, 10))
                : COPY.replay.noticeUndated}
          </Notice>
        )}
        {budgetNotices}

        {replay ? (
          <QuestionPicker
            questions={config.questions}
            selectedId={selected?.id ?? null}
            running={running}
            onPick={(question) => settings && replayQuestion(question, settings)}
            onStop={trace.cancel}
          />
        ) : (
          questionForm
        )}
        {config && settings && (
          <SettingsStrip
            config={config}
            settings={settings}
            disabled={running}
            stale={stale && !running}
            agentPause={agentPause}
            onChange={changeSettings}
          />
        )}
        {connectionError}
      </section>

      <section
        id="rag-working"
        aria-labelledby="working-title"
        className="scroll-mt-6 space-y-3 md:space-y-4"
      >
        <div className="flex items-baseline gap-3 border-b pb-2">
          <Typography variant="label" as="h2" id="working-title">
            {COPY.workingLabel}
          </Typography>
          <Typography variant="small" color="muted" as="span">
            {COPY.workingNote(order.length)}
          </Typography>
        </div>
        <StepList order={order} events={trace.events} runStatus={trace.status} context={context} />
      </section>

      {context.citations && (
        <AnswerResult
          citations={context.citations}
          done={trace.done}
          evalsHref={runEvalsHref(trace.input)}
        />
      )}

      {announcer}
    </div>
  );
};

export { PipelineExplorer };
