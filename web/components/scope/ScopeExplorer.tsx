'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Notice } from '@/components/site/Notice';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import { SCOPE } from '@/content/scope';
import { SCOPE_STAGE_ORDER, SCOPE_STAGES } from '@/content/scope-stages';
import { PickCards, PickChips } from '@/components/site/PickCards';
import { formatMs } from '@/lib/format';
import { oneLine } from '@/lib/preview';
import { fetchScopeConfig } from '@/lib/scope/api';
import { scopeStatuses } from '@/lib/scope/steps';
import type { Example, RequestData, ScopeConfig, ThresholdsData } from '@/lib/scope/types';
import {
  defaultScopeSettings,
  parseScopeUrl,
  type ScopeSettings,
  writeScopeUrl,
} from '@/lib/scope/url-state';
import { useScopeStream } from '@/lib/scope/use-scope-stream';
import { getView, useView, useViewLink } from '@/lib/view-store';

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

// The Simple view's cards: the product's featured messages first (one per action, see
// SCOPE.featured), then the rest behind "More", each as one clean line.
const pickItems = (examples: Example[], preset: string) => {
  const mine = examples.filter((e) => e.preset === preset);
  const ids = SCOPE.featured[preset] ?? mine.slice(0, 4).map((e) => e.id);
  const featured = ids.flatMap((id) => mine.filter((e) => e.id === id));
  const item = (e: Example) => ({
    id: e.id,
    text: oneLine(e.text),
    note: e.context.length > 0 ? SCOPE.pick.turns(e.context.length) : undefined,
  });
  return {
    featured: featured.map(item),
    more: mine.filter((e) => !featured.includes(e)).map(item),
  };
};

// The message that plays when none is linked: the first card in Simple, the preset's first
// example in every step.
const firstExample = (config: ScopeConfig, preset: string): string | null =>
  (getView() === 'simple'
    ? pickItems(config.examples, preset).featured[0]?.id
    : config.examples.find((e) => e.preset === preset)?.id) ?? null;

const ScopeExplorer = () => {
  const [configState, setConfigState] = useState<ConfigState>({ status: 'loading' });
  const [settings, setSettings] = useState<ScopeSettings | null>(null);
  const trace = useScopeStream();
  const { run } = trace;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The view is shared with the header's toggle (lib/view-store.ts); this page owns the link.
  const simple = useView() === 'simple';
  // Opens every step and scrolls to the working once it is drawn ("See how it decided").
  const switchTo = useViewLink();

  const replay = useCallback(
    (next: ScopeSettings) => {
      if (next.example) run({ ...next, example: next.example });
    },
    [run],
  );

  // A linked example (?preset=rag&example=rag-world-cup) replays at once: it costs nothing. With
  // none linked, the first card plays (the preset's first example in every step), so the page
  // never opens empty; the link stays as it was until the visitor picks one.
  const requestConfig = useCallback(
    (signal?: AbortSignal) => {
      fetchScopeConfig(signal)
        .then((config) => {
          const parsed = parseScopeUrl(window.location.search, config);
          const first = firstExample(config, parsed.preset);
          const linked = parsed.example || !first ? parsed : { ...parsed, example: first };
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
    writeScopeUrl({ ...next, view: getView() }, config!);
    clearTimeout(timer.current);
    if (delay === 0) replay(next);
    else timer.current = setTimeout(() => replay(next), delay);
  };

  const pick = (example: Example) => apply({ ...settings!, example: example.id }, 0);
  const changePreset = (preset: string) => {
    trace.reset();
    apply({ ...settings!, preset, example: null, edit: {} }, 0);
  };
  // The Simple view never shows an empty card: a new product plays its first message.
  const choosePreset = (preset: string) => {
    trace.reset();
    apply({ ...settings!, preset, example: firstExample(config!, preset), edit: {} }, 0);
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

  const lastEvent = trace.events.at(-1);
  const announcement = lastEvent
    ? SCOPE.announce(
        lastEvent.label,
        SCOPE_STAGES[lastEvent.stage].title,
        COPY.status[lastEvent.status],
        formatMs(lastEvent.ms),
      )
    : '';

  const hero = (
    <ScopeHero
      diagram={
        <ScopeDiagram
          statusOf={statusOf}
          action={decision?.action}
          className="rounded-md border border-solid px-4 md:px-5"
        />
      }
    />
  );

  const configNotices = (
    <>
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
    </>
  );

  const replayNotice = config && (
    <Notice tone="note">
      {config.illustrative
        ? SCOPE.illustrative
        : config.recorded_at
          ? SCOPE.replayNotice(config.recorded_at.slice(0, 10))
          : SCOPE.replayUndated}
    </Notice>
  );

  const bridge = preset?.id === 'rag' && (
    <RagBridge
      examples={config!.examples.filter((e) => e.preset === 'rag')}
      disabled={running}
      onPick={pick}
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

  // Simple: a one-line question, the product and message as tappable choices, then one card.
  if (simple) {
    const items = config && settings ? pickItems(config.examples, settings.preset) : null;
    return (
      <div className="space-y-6">
        <section aria-labelledby="sheet-title" className="space-y-4">
          <Typography variant="sheetTitle" as="h1" id="sheet-title">
            {SCOPE.intro.title}
          </Typography>
          {configNotices}
          {config && settings && items && (
            <>
              <PickChips
                label={SCOPE.presets.label}
                options={config.presets}
                value={settings.preset}
                onChange={choosePreset}
              />
              <PickCards
                label={SCOPE.pick.message}
                featured={items.featured}
                more={items.more}
                selectedId={settings.example}
                empty={SCOPE.picker.empty}
                moreLabel={SCOPE.pick.more}
                fewerLabel={SCOPE.pick.fewer}
                onPick={(id) => pick(config.examples.find((e) => e.id === id)!)}
              />
            </>
          )}
          {connectionError}
        </section>

        <section
          id="scope-working"
          aria-labelledby="working-title"
          className="scroll-mt-6 space-y-3"
        >
          <Typography variant="label" as="h2" id="working-title" className="sr-only">
            {SCOPE.simple.title}
          </Typography>
          <ScopeSimple
            events={trace.events}
            runStatus={trace.status}
            onShowSteps={() => switchTo('scope-working')}
          />
          {config && (
            <Typography variant="small" color="muted">
              {config.illustrative ? SCOPE.simple.illustrative : SCOPE.simple.recorded}
            </Typography>
          )}
        </section>
        {announcer}
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      {hero}

      <section aria-labelledby="sheet-title" className="space-y-4 md:space-y-5">
        <Typography variant="sheetTitle" as="h2" id="sheet-title" className="break-words">
          <span className="voice-data mr-3 align-[0.2em] text-sm font-normal tracking-normal text-muted-foreground">
            {SCOPE.sheetLabel} ·
          </span>
          <span className="line-clamp-4">
            {request?.message ?? example?.text ?? SCOPE.emptyTitle}
          </span>
        </Typography>

        {configNotices}
        {replayNotice}

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
            {bridge}
            <div id="scope-settings" className="scroll-mt-6 space-y-4 md:space-y-5">
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
            </div>
          </>
        )}
        {connectionError}
      </section>

      <section
        id="scope-working"
        aria-labelledby="working-title"
        className="scroll-mt-6 space-y-3 md:space-y-4"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 border-b pb-2">
          <Typography variant="label" as="h2" id="working-title">
            {SCOPE.workingLabel}
          </Typography>
          <Typography variant="small" color="muted" as="span">
            {SCOPE.workingNote(SCOPE_STAGE_ORDER.length)}
          </Typography>
        </div>
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
      </section>

      {decision && (
        <ScopeResult decision={decision} events={trace.events} done={trace.done !== null} />
      )}

      <Principles />
      {announcer}
    </div>
  );
};

export { ScopeExplorer };
