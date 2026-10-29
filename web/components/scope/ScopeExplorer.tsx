'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Notice } from '@/components/site/Notice';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import { SCOPE } from '@/content/scope';
import { SCOPE_STAGE_ORDER, SCOPE_STAGES } from '@/content/scope-stages';
import { formatMs } from '@/lib/format';
import { fetchScopeConfig } from '@/lib/scope/api';
import { scopeStatuses } from '@/lib/scope/steps';
import type { Example, RequestData, ScopeConfig, ThresholdsData } from '@/lib/scope/types';
import {
  defaultScopeSettings,
  parseScopeUrl,
  type ScopeSettings,
  type ScopeView,
  writeScopeUrl,
} from '@/lib/scope/url-state';
import { useScopeStream } from '@/lib/scope/use-scope-stream';

import { ExamplePicker } from './ExamplePicker';
import { Principles } from './Principles';
import { RagBridge } from './RagBridge';
import { ScopeDiagram } from './ScopeDiagram';
import { ScopeEditor } from './ScopeEditor';
import { ScopeHero } from './ScopeHero';
import { ScopeResult } from './ScopeResult';
import { ScopeSettingsStrip } from './ScopeSettings';
import { ScopeSimple } from './ScopeSimple';
import { ScopeStepList } from './ScopeStepList';

// A slider sends many changes in a row; the replay starts once it rests.
export const REPLAY_DELAY_MS = 150;

type ConfigState =
  | { status: 'loading' }
  | { status: 'ready'; config: ScopeConfig }
  | { status: 'error'; message: string };

// Settings that differ from the defaults (the definition editor has its own reset).
const tuned = (settings: ScopeSettings, config: ScopeConfig) => {
  const base = defaultScopeSettings(config, settings.preset);
  const pick = ({ context, signals, weights, thresholds, k }: ScopeSettings) =>
    JSON.stringify({ context, signals, weights, thresholds, k });
  return pick(settings) !== pick(base);
};

const ScopeExplorer = () => {
  const [configState, setConfigState] = useState<ConfigState>({ status: 'loading' });
  const [settings, setSettings] = useState<ScopeSettings | null>(null);
  const trace = useScopeStream();
  const { run } = trace;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const working = useRef<HTMLElement>(null);

  const replay = useCallback(
    (next: ScopeSettings) => {
      if (next.example) run({ ...next, example: next.example });
    },
    [run],
  );

  // A linked example (?preset=rag&example=rag-world-cup) replays at once: it costs nothing.
  const requestConfig = useCallback(
    (signal?: AbortSignal) => {
      fetchScopeConfig(signal)
        .then((config) => {
          const linked = parseScopeUrl(window.location.search, config);
          setConfigState({ status: 'ready', config });
          setSettings(linked);
          replay(linked);
        })
        .catch((error: unknown) => {
          if (signal?.aborted) return;
          setConfigState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        });
    },
    [replay],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestConfig(controller.signal);
    return () => {
      controller.abort();
      clearTimeout(timer.current);
    };
  }, [requestConfig]);

  const config = configState.status === 'ready' ? configState.config : null;

  const apply = (next: ScopeSettings, delay: number) => {
    setSettings(next);
    writeScopeUrl(next, config!);
    clearTimeout(timer.current);
    if (delay === 0) replay(next);
    else timer.current = setTimeout(() => replay(next), delay);
  };

  // Switching the view changes only the layout and the link; nothing is replayed.
  const setView = (view: ScopeView) => {
    const next = { ...settings!, view };
    setSettings(next);
    writeScopeUrl(next, config!);
  };
  const showSteps = () => {
    setView('steps');
    working.current?.scrollIntoView?.({ block: 'start' });
  };

  const pick = (example: Example) => apply({ ...settings!, example: example.id }, 0);
  const changePreset = (preset: string) => {
    trace.reset();
    apply({ ...settings!, preset, example: null, edit: {} }, 0);
  };

  const byStage = useMemo(() => new Map(trace.events.map((e) => [e.stage, e])), [trace.events]);
  const request = byStage.get('request')?.data as RequestData | undefined;
  const decision = byStage.get('thresholds')?.data as ThresholdsData | undefined;
  const statusOf = scopeStatuses(SCOPE_STAGE_ORDER, trace.events, trace.status);
  const running = trace.status === 'running';
  // The preset always comes from the config (lib/scope/url-state.ts), so it is always listed.
  const preset = config && settings ? config.presets.find((p) => p.id === settings.preset)! : null;
  const example = config?.examples.find((e) => e.id === settings?.example);
  const ran = trace.input;
  const simple = settings?.view === 'simple';

  const lastEvent = trace.events.at(-1);
  const announcement = lastEvent
    ? SCOPE.announce(
        lastEvent.label,
        SCOPE_STAGES[lastEvent.stage].title,
        COPY.status[lastEvent.status],
        formatMs(lastEvent.ms),
      )
    : '';

  return (
    <div className="space-y-8 md:space-y-10">
      <ScopeHero
        diagram={
          <ScopeDiagram
            statusOf={statusOf}
            action={decision?.action}
            className="rounded-md border border-solid px-4 md:px-5"
          />
        }
      />
      <Principles />

      <section aria-labelledby="sheet-title" className="space-y-4 md:space-y-5">
        <Typography variant="sheetTitle" as="h2" id="sheet-title" className="break-words">
          <span className="voice-data mr-3 align-[0.2em] text-sm font-normal tracking-normal text-muted-foreground">
            {SCOPE.sheetLabel} ·
          </span>
          <span className="line-clamp-4">
            {request?.message ?? example?.text ?? SCOPE.emptyTitle}
          </span>
        </Typography>

        {configState.status === 'loading' && <Notice tone="note">{SCOPE.starting}</Notice>}
        {configState.status === 'error' && (
          <Notice tone="error">
            <p>
              {SCOPE.offline} {configState.message}
            </p>
            <Button
              variant="pencil"
              size="inline"
              className="mt-1"
              onClick={() => {
                setConfigState({ status: 'loading' });
                requestConfig();
              }}
            >
              {SCOPE.retry}
            </Button>
          </Notice>
        )}
        {config && (
          <Notice tone="note">
            {config.illustrative
              ? SCOPE.illustrative
              : config.recorded_at
                ? SCOPE.replayNotice(config.recorded_at.slice(0, 10))
                : SCOPE.replayUndated}
          </Notice>
        )}

        {config && settings && preset && (
          <>
            <ExamplePicker
              presets={config.presets}
              preset={settings.preset}
              examples={config.examples}
              selectedId={settings.example}
              running={running}
              onPreset={changePreset}
              onPick={pick}
              onStop={trace.cancel}
            />
            {preset.id === 'rag' && (
              <RagBridge
                examples={config.examples.filter((e) => e.preset === 'rag')}
                disabled={running}
                onPick={pick}
              />
            )}
            {simple ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-dashed py-2">
                <Typography variant="small" color="muted" as="span">
                  {SCOPE.simple.settingsNote}
                </Typography>
                <Button
                  variant="pencil"
                  size="inline"
                  className="min-h-10 text-sm"
                  onClick={() => setView('steps')}
                >
                  {SCOPE.simple.settings}
                </Button>
              </div>
            ) : (
              <>
                <ScopeSettingsStrip
                  settings={settings}
                  changed={tuned(settings, config)}
                  disabled={false}
                  onChange={(next) => apply(next, REPLAY_DELAY_MS)}
                  onReset={() =>
                    apply(
                      {
                        ...defaultScopeSettings(config, settings.preset),
                        example: settings.example,
                        edit: settings.edit,
                      },
                      0,
                    )
                  }
                />
                <ScopeEditor
                  key={preset.id}
                  preset={preset}
                  edit={settings.edit}
                  disabled={false}
                  onChange={(edit) => apply({ ...settings, edit }, 0)}
                />
              </>
            )}
          </>
        )}
        {trace.connectionError && <Notice tone="warning">{trace.connectionError}</Notice>}
      </section>

      <section
        ref={working}
        aria-labelledby="working-title"
        className="scroll-mt-6 space-y-3 md:space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
            <Typography variant="label" as="h2" id="working-title">
              {simple ? SCOPE.simple.title : SCOPE.workingLabel}
            </Typography>
            <Typography variant="small" color="muted" as="span">
              {simple ? SCOPE.simple.intro : SCOPE.workingNote(SCOPE_STAGE_ORDER.length)}
            </Typography>
          </div>
          {settings && (
            <div className="flex items-center gap-2">
              <span id="scope-view-label" className="text-sm text-muted-foreground">
                {SCOPE.view.label}
              </span>
              <SegmentedControl
                name="scope-view"
                labelledBy="scope-view-label"
                size="sm"
                value={settings.view}
                onChange={(value) => setView(value as ScopeView)}
                options={[
                  { value: 'simple', label: SCOPE.view.simple },
                  { value: 'steps', label: SCOPE.view.steps },
                ]}
              />
            </div>
          )}
        </div>
        {simple ? (
          <ScopeSimple
            events={trace.events}
            runStatus={trace.status}
            signals={ran?.signals ?? null}
            onShowSteps={showSteps}
          />
        ) : (
          <ScopeStepList
            events={trace.events}
            runStatus={trace.status}
            context={{
              preset: ran?.preset ?? settings?.preset ?? '',
              message: request?.message ?? '',
              block: ran?.thresholds.block ?? 0.5,
              edit: ran?.edit ?? {},
            }}
          />
        )}
      </section>

      {decision && !simple && (
        <ScopeResult decision={decision} events={trace.events} done={trace.done !== null} />
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
};

export { ScopeExplorer };
