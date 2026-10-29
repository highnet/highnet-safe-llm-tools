import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ScopePage from '@/app/scope/page';
import { ScopeExplorer } from '@/components/scope/ScopeExplorer';
import { SCOPE } from '@/content/scope';
import { clearDatasetCache } from '@/lib/scope/api';

import { ControlledEventSource } from './helpers';
import { type Recorded, recording, scopeConfig, stubScopeFetch } from './scope-fixtures';

const S = SCOPE.settings;

const play = (rec: Recorded, source = ControlledEventSource.last(), finish = true) =>
  act(() => {
    rec.events.forEach((e) => source.emit('trace', e));
    if (finish) source.emit('done', rec.done);
  });

const ready = () => screen.findByRole('heading', { name: SCOPE.picker.title });

beforeEach(() => {
  ControlledEventSource.instances = [];
  vi.stubGlobal('EventSource', ControlledEventSource);
  clearDatasetCache();
});

afterEach(() => vi.unstubAllGlobals());

describe('scope explorer states', () => {
  it('explains a failed connection and retries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 502 })),
    );
    render(<ScopeExplorer />);
    expect(await screen.findByText(/The API answered 502/)).toBeInTheDocument();
    stubScopeFetch();
    fireEvent.click(screen.getByRole('button', { name: SCOPE.retry }));
    expect(screen.getByText(SCOPE.starting)).toBeInTheDocument();
    await ready();
  });

  it('stays quiet when it is unmounted while the config loads', async () => {
    const fetch = vi.fn(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    vi.stubGlobal('fetch', fetch);
    const { unmount } = render(<ScopeExplorer />);
    unmount();
    await act(async () => undefined);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports a retry that fails again', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 502 })),
    );
    render(<ScopeExplorer />);
    await screen.findByText(/The API answered 502/);
    fireEvent.click(screen.getByRole('button', { name: SCOPE.retry }));
    expect(await screen.findByText(/The API answered 502/)).toBeInTheDocument();
  });

  it('reports non-Error failures too', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject('offline')),
    );
    render(<ScopeExplorer />);
    expect(await screen.findByText(/offline/)).toBeInTheDocument();
  });

  it('says when data is illustrative or the recording is undated', async () => {
    stubScopeFetch({ ...scopeConfig(), illustrative: true });
    const { unmount } = render(<ScopeExplorer />);
    expect(await screen.findByText(SCOPE.illustrative)).toBeInTheDocument();
    unmount();
    stubScopeFetch({ ...scopeConfig(), recorded_at: null, examples: [] });
    render(<ScopeExplorer />);
    expect(await screen.findByText(SCOPE.replayUndated)).toBeInTheDocument();
    expect(screen.getByText(SCOPE.picker.empty)).toBeInTheDocument();
  });

  it('renders the page with its header and footer', async () => {
    stubScopeFetch();
    render(<ScopePage />);
    expect(screen.getByRole('heading', { level: 1, name: SCOPE.hero.title })).toBeInTheDocument();
    await ready();
  });
});

describe('scope explorer runs', () => {
  it('replays a picked message step by step, announces it, and can be stopped', async () => {
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    expect(screen.getByText(SCOPE.emptyTitle)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /What's a good lasagna recipe\?/ }));
    const source = ControlledEventSource.last();
    expect(source.url).toContain('/api/scope/run?preset=career&example=career-lasagna');
    expect(window.location.search).toBe('?preset=career&example=career-lasagna');
    expect(screen.getByRole('button', { name: SCOPE.stop })).toBeInTheDocument();
    const rec = recording('lasagna-recipe');
    play({ ...rec, events: rec.events.slice(0, 3) }, source, false);
    expect(screen.getByText(/Step 3, Run the rule prefilter: done/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: SCOPE.stop }));
    expect(screen.getByText(SCOPE.streamErrors.stopped)).toBeInTheDocument();
    // Stopping twice, or failing after a stop, changes nothing.
    act(() => source.fail());
    expect(screen.queryByText(SCOPE.streamErrors.closed)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /What's a good lasagna recipe\?/ }));
    play(rec);
    expect(screen.getByRole('heading', { name: SCOPE.result.label })).toBeInTheDocument();
    expect(screen.getByText(/Recorded totals/)).toBeInTheDocument();
    expect(screen.getAllByText('Answer').length).toBeGreaterThan(1);
  });

  it('marks a failed step on the diagram and explains the formulas', async () => {
    window.history.replaceState(null, '', '/scope/?preset=career&example=career-recruiter');
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    play(recording('invalid-verdict'));
    const diagram = screen.getByRole('figure', { name: SCOPE.diagram.title });
    expect(within(diagram).getByRole('link', { name: /Ask the LLM judge/ })).toHaveAttribute(
      'data-status',
      'error',
    );
    fireEvent.click(within(diagram).getByRole('button', { name: SCOPE.formal.title }));
    fireEvent.click(within(diagram).getAllByRole('button', { name: /^cos: / })[0]);
    expect(within(diagram).getAllByText('cosine similarity').length).toBeGreaterThan(1);
  });

  it('says when the stream closes early', async () => {
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: /negotiate my salary/ }));
    act(() => ControlledEventSource.last().fail());
    expect(screen.getByText(SCOPE.streamErrors.closed)).toBeInTheDocument();
  });

  it('replays a linked example at once and connects the RAG preset to RAG', async () => {
    window.history.replaceState(null, '', '/scope/?preset=rag&example=rag-world-cup');
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    expect(ControlledEventSource.last().url).toContain('example=rag-world-cup');
    play(recording('world-cup'));
    expect(
      screen.getByRole('heading', { level: 2, name: /Who won the 2018 FIFA World Cup\?/ }),
    ).toBeInTheDocument();
    const bridge = screen.getByRole('region', { name: SCOPE.bridge.title });
    expect(within(bridge).getByText(/The judge labelled it off scope/)).toBeInTheDocument();
    expect(
      within(bridge).getByRole('link', { name: SCOPE.bridge.notInCorpus.link }),
    ).toHaveAttribute('href', '/rag/?q=Who%20won%20the%202018%20FIFA%20World%20Cup%3F');
    fireEvent.click(
      within(bridge).getAllByRole('button', { name: SCOPE.bridge.offScope.replay })[1],
    );
    expect(ControlledEventSource.last().url).toContain('example=rag-lasagna');
  });

  it('re-runs when a setting changes, and resets the settings', async () => {
    window.history.replaceState(null, '', '/scope/?preset=career&example=career-salary');
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    const count = () => ControlledEventSource.instances.length;
    expect(count()).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: SCOPE.signals.knn }));
    await waitFor(() => expect(count()).toBe(2));
    expect(ControlledEventSource.last().url).toContain('knn=false');
    expect(screen.getByRole('button', { name: S.more })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: SCOPE.signals.knn }));

    fireEvent.change(screen.getByLabelText(SCOPE.signals.rules), { target: { value: '0.6' } });
    fireEvent.change(screen.getByLabelText(S.thresholdNames.brief), { target: { value: '0.3' } });
    fireEvent.click(screen.getByRole('button', { name: S.more }));
    fireEvent.click(screen.getByRole('button', { name: S.fewer }));
    fireEvent.click(screen.getByRole('button', { name: S.fewer }));
    fireEvent.click(screen.getByRole('radio', { name: S.contextOptions.off }));
    // Changes in a row replay once, when they rest.
    await waitFor(() => expect(count()).toBe(3));
    const url = ControlledEventSource.last().url;
    expect(url).toContain('w_rules=0.6');
    expect(url).toContain('t_brief=0.3');
    expect(url).toContain('k=6');
    expect(url).toContain('context=false');
    expect(window.location.search).toContain('k=6');

    fireEvent.click(screen.getByRole('button', { name: S.reset }));
    expect(count()).toBe(4);
    expect(ControlledEventSource.last().url).toContain('w_rules=0.25');
    expect(screen.queryByRole('button', { name: S.reset })).not.toBeInTheDocument();
  });

  it('edits the scope definition, then resets it', async () => {
    window.history.replaceState(null, '', '/scope/?preset=career&example=career-fibonacci');
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: /Scope definition/ }));
    const row = screen.getByText('Coding practice for interviews').closest('li')!;
    fireEvent.click(within(row).getByRole('radio', { name: 'in scope' }));
    expect(ControlledEventSource.last().url).toContain('edit=coding_practice%3Ain');
    expect(screen.getByText(SCOPE.editor.judgeSkipped)).toBeInTheDocument();
    expect(screen.getByText(SCOPE.editor.moved(1))).toBeInTheDocument();
    play(recording('edited'));
    expect(screen.getAllByText(SCOPE.steps.knn.relabelled).length).toBeGreaterThan(0);
    // Moving it back to where it started is no edit at all.
    fireEvent.click(within(row).getByRole('radio', { name: 'adjacent' }));
    expect(ControlledEventSource.last().url).not.toContain('edit=');
    fireEvent.click(within(row).getByRole('radio', { name: 'off scope' }));
    fireEvent.click(screen.getByRole('button', { name: SCOPE.editor.reset }));
    expect(screen.queryByText(SCOPE.editor.judgeSkipped)).not.toBeInTheDocument();
  });

  it('switches presets, clearing the sheet, and folds long groups', async () => {
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: /lasagna/ }));
    play(recording('lasagna-recipe'));
    fireEvent.click(screen.getByRole('button', { name: 'Recipe assistant' }));
    expect(window.location.search).toBe('?preset=recipe');
    expect(screen.getByText(SCOPE.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: SCOPE.result.label })).not.toBeInTheDocument();
    const more = screen.getByRole('button', { name: SCOPE.picker.more(13) });
    fireEvent.click(more);
    expect(screen.getByRole('button', { name: SCOPE.picker.fewer })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: SCOPE.picker.fewer }));
    expect(screen.getByRole('button', { name: SCOPE.picker.more(13) })).toBeInTheDocument();
  });

  it('keeps a folded group open when its selected message is folded', async () => {
    window.history.replaceState(null, '', '/scope/?preset=career&example=career-linkedin');
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    expect(screen.getByRole('button', { name: /LinkedIn headline/, pressed: true })).toBeVisible();
    expect(screen.queryByRole('button', { name: /more$/ })).not.toBeInTheDocument();
  });

  it('folds the settings to one line on phones', async () => {
    globalThis.__wide = false;
    window.history.replaceState(null, '', '/scope/?preset=career&rules=0&judge=0&context=0');
    stubScopeFetch();
    render(<ScopeExplorer />);
    await ready();
    expect(screen.getByText('Rules, LLM judge off · k=7 · no context · tuned')).toBeInTheDocument();
  });
});
