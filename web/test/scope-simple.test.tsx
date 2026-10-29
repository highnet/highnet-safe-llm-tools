import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderToString } from 'react-dom/server';

import ScopePage from '@/app/scope/page';
import { CompactPicker } from '@/components/scope/CompactPicker';
import { ScopeExplorer } from '@/components/scope/ScopeExplorer';
import { ScopeSimple } from '@/components/scope/ScopeSimple';
import { ScopeViewToggle } from '@/components/site/ScopeViewToggle';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SCOPE } from '@/content/scope';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import { clearDatasetCache } from '@/lib/scope/api';
import type { Signal } from '@/lib/scope/types';
import type { RunStatus } from '@/lib/use-trace-stream';

import { ControlledEventSource } from './helpers';
import { recording, scopeConfig, stage, stubScopeFetch } from './scope-fixtures';

const S = SCOPE.simple;
const ALL_ON: Record<Signal, boolean> = { rules: true, knn: true, judge: true, decide: true };

const simple = (
  events: ScopeTraceEvent[],
  runStatus: RunStatus = 'finished',
  signals: Record<Signal, boolean> | null = ALL_ON,
  onShowSteps = () => {},
) =>
  render(
    <ScopeSimple
      events={events}
      runStatus={runStatus}
      signals={signals}
      onShowSteps={onShowSteps}
      onSettings={() => {}}
    />,
  );

const row = (advisor: Signal) => screen.getByText(S.advisors[advisor]).closest('li')!;

// Swap one stage's event for another (or drop it with null).
const swap = (events: ScopeTraceEvent[], name: string, next: ScopeTraceEvent | null) =>
  events.flatMap((e) => (e.stage === name ? (next ? [next] : []) : [e]));

beforeEach(() => {
  ControlledEventSource.instances = [];
  vi.stubGlobal('EventSource', ControlledEventSource);
  clearDatasetCache();
});
afterEach(() => vi.unstubAllGlobals());

describe('the Simple view', () => {
  it('waits for a message, then for the run', () => {
    const { unmount } = simple([], 'idle', null);
    expect(screen.getByText(S.empty)).toBeInTheDocument();
    unmount();
    simple([], 'running', null);
    expect(screen.getByText(S.deciding)).toBeInTheDocument();
  });

  it('tells the whole run in plain words, from its trace', () => {
    const onShowSteps = vi.fn();
    // The offline capture with earlier turns and all four advisors.
    simple(recording('decide').events, 'finished', ALL_ON, onShowSteps);
    expect(screen.getByText(S.earlier)).toBeInTheDocument();
    expect(screen.getByText('I have a coding interview tomorrow')).toBeInTheDocument();
    expect(screen.getByText('Write a Fibonacci function in Python')).toBeInTheDocument();
    expect(screen.getByText(S.outcomes.answer_briefly)).toBeInTheDocument();
    expect(within(row('decide')).getByText(S.sure('60%'))).toBeInTheDocument();
    expect(within(row('decide')).getByText(S.labels.in)).toBeInTheDocument();
    expect(within(row('knn')).getByText(S.labels.adjacent)).toBeInTheDocument();
    expect(screen.getByText(S.combined(S.votes(4), '43%'))).toBeInTheDocument();
    expect(screen.getByText('An illustrative answer from the offline stand-in.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: S.every }));
    expect(onShowSteps).toHaveBeenCalledOnce();
  });

  it('says plainly why an advisor did not vote', () => {
    const { unmount } = simple(recording('rules-only').events, 'finished', {
      ...ALL_ON,
      knn: false,
      judge: false,
    });
    expect(within(row('knn')).getByText(S.notRun.off)).toBeInTheDocument();
    expect(within(row('judge')).getByText(S.notRun.off)).toBeInTheDocument();
    // Recorded before the second judge existed: no event at all.
    expect(within(row('decide')).getByText(S.notRun.other)).toBeInTheDocument();
    unmount();
    const edited = simple(recording('edited').events, 'running', null);
    expect(within(row('judge')).getByText(S.notRun.edited)).toBeInTheDocument();
    expect(within(row('decide')).getByText(S.notRun.waiting)).toBeInTheDocument();
    edited.unmount();
    const events = recording('world-cup').events;
    const rules = stage(recording('world-cup'), 'rules');
    const knn = stage(recording('world-cup'), 'knn');
    simple(
      swap(
        swap(events, 'rules', { ...rules, data: { ...rules.data, distribution: null } }),
        'knn',
        { ...knn, status: 'skipped', data: { reason: 'There is no embedding to compare.' } },
      ),
    );
    expect(within(row('rules')).getByText(S.notRun.abstained)).toBeInTheDocument();
    expect(within(row('knn')).getByText(S.notRun.other)).toBeInTheDocument();
  });

  it('marks an advisor that failed, and one with no recording yet', () => {
    const events = recording('invalid-verdict').events;
    const judge = stage(recording('invalid-verdict'), 'judge');
    simple([
      ...events,
      {
        ...judge,
        stage: 'decide',
        data: { error: { type: 'NotRecordedError', message: 'No decide call was recorded.' } },
      },
    ]);
    expect(within(row('judge')).getByText(S.notRun.failed)).toHaveClass('text-destructive');
    expect(within(row('decide')).getByText(S.notRun.notRecorded)).toBeInTheDocument();
  });

  it('shows the RAG hand-off, the preset’s own reply, or that there is none', () => {
    const events = recording('world-cup').events;
    const respond = stage(recording('world-cup'), 'respond');
    const { unmount } = simple(events);
    expect(screen.getByText(S.handoffBrief)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: S.openRag })).toHaveAttribute(
      'href',
      '/rag/?q=Who%20won%20the%202018%20FIFA%20World%20Cup%3F',
    );
    unmount();
    const full = simple(
      swap(events, 'respond', {
        ...respond,
        data: { action: 'answer', handoff: 'rag', brief: false },
      }),
    );
    expect(screen.getByText(S.handoff)).toBeInTheDocument();
    full.unmount();
    simple(
      swap(events, 'respond', {
        ...respond,
        status: 'warning',
        data: { action: 'answer', error: { type: 'not_recorded', message: 'none' } },
      }),
    );
    expect(screen.getByText(S.noReply)).toBeInTheDocument();
  });

  it('says when the run stops before a decision, or the request is refused', () => {
    const events = recording('world-cup').events.slice(0, 4);
    const { unmount } = simple(events, 'running');
    expect(screen.getAllByText(S.deciding).length).toBe(1);
    expect(screen.queryByText(S.combinedTitle)).not.toBeInTheDocument();
    unmount();
    const stopped = simple(events, 'failed');
    expect(screen.getByText(S.stopped)).toBeInTheDocument();
    stopped.unmount();
    const request = stage(recording('world-cup'), 'request');
    simple([
      {
        ...request,
        status: 'error',
        data: { ...request.data, error: { type: 'too_long', message: 'Too long.' } },
      },
    ]);
    expect(screen.getByText('Too long.')).toBeInTheDocument();
    expect(screen.queryByText(S.voters)).not.toBeInTheDocument();
  });
});

describe('switching between Simple and every step', () => {
  const flushFrame = () =>
    act(() => new Promise((done) => requestAnimationFrame(() => done(null))));

  it('shares the view between the header and the page, and keeps it in the link', async () => {
    window.history.replaceState(null, '', '/scope/?preset=career&example=career-salary');
    stubScopeFetch();
    render(<ScopePage />);
    const toggle = screen.getByRole('radiogroup', { name: SCOPE.view.label });
    expect(within(toggle).getByRole('radio', { name: SCOPE.view.simple })).toBeChecked();
    expect(screen.getByRole('heading', { level: 1, name: SCOPE.intro.title })).toBeInTheDocument();
    await screen.findByRole('combobox', { name: SCOPE.compact.message });
    expect(screen.queryByText(SCOPE.settings.weights)).not.toBeInTheDocument();
    const runs = ControlledEventSource.instances.length;
    const source = ControlledEventSource.last();
    act(() => recording('world-cup').events.forEach((e) => source.emit('trace', e)));

    // "Change the settings" opens every step and scrolls to the settings once they are drawn.
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    fireEvent.click(screen.getByRole('button', { name: S.settings }));
    await flushFrame();
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    expect(window.location.search).toBe('?preset=career&example=career-salary&view=steps');
    expect(within(toggle).getByRole('radio', { name: SCOPE.view.steps })).toBeChecked();
    expect(screen.getByText(SCOPE.settings.weights)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: SCOPE.hero.title })).toBeInTheDocument();

    // The header's toggle switches the page back.
    fireEvent.click(within(toggle).getByRole('radio', { name: SCOPE.view.simple }));
    expect(window.location.search).toBe('?preset=career&example=career-salary');
    expect(screen.getByRole('heading', { level: 2, name: SCOPE.hero.title })).toBeInTheDocument();

    // @ts-expect-error jsdom has no scrollIntoView; put it back the way it was.
    delete Element.prototype.scrollIntoView;
    fireEvent.click(screen.getByRole('button', { name: S.every }));
    await flushFrame();
    expect(within(toggle).getByRole('radio', { name: SCOPE.view.steps })).toBeChecked();
    expect(ControlledEventSource.instances.length).toBe(runs);
  });

  it('picks the product and the message from two selects', async () => {
    const config = scopeConfig();
    stubScopeFetch({ ...config, examples: config.examples.filter((e) => e.preset !== 'bank') });
    render(<ScopeExplorer />);
    const message = await screen.findByRole('combobox', { name: SCOPE.compact.message });
    // The preset's first message is already playing; the link stays bare until a pick.
    expect(ControlledEventSource.last().url).toContain('example=career-');
    expect(window.location.search).toBe('');
    fireEvent.change(message, { target: { value: 'career-lasagna' } });
    expect(window.location.search).toBe('?preset=career&example=career-lasagna');
    const product = screen.getByRole('combobox', { name: SCOPE.presets.label });
    fireEvent.change(product, { target: { value: 'rag' } });
    expect(window.location.search).toMatch(/^\?preset=rag&example=rag-/);
    expect(within(message).getByRole('group', { name: SCOPE.picker.groups.rag })).toBeVisible();
    // A product with no recorded messages leaves the message select empty and disabled.
    fireEvent.change(product, { target: { value: 'bank' } });
    expect(window.location.search).toBe('?preset=bank');
    expect(message).toBeDisabled();
    expect(within(message).getByRole('option', { name: SCOPE.picker.empty })).toBeInTheDocument();
  });

  it('asks for a message when none is chosen yet', () => {
    const config = scopeConfig();
    render(
      <CompactPicker
        presets={config.presets}
        preset="career"
        examples={config.examples}
        selectedId={null}
        onPreset={() => {}}
        onPick={() => {}}
      />,
    );
    expect(screen.getByRole('option', { name: SCOPE.picker.title })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Write a Fibonacci function in Python \(after 2/ }),
    ).toBeInTheDocument();
  });

  it('keeps the plain product links on every other page', () => {
    render(<SiteHeader product="scope" current="evals" />);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scope' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders the Simple view on the server, the default', () => {
    expect(renderToString(<ScopeViewToggle />)).toContain('checked="" value="simple"');
  });
});
