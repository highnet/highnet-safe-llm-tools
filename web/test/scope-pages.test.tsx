import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ScopeCoveragePage from '@/app/scope/coverage/page';
import ScopeDatasetPage from '@/app/scope/dataset/page';
import ScopeEvalsPage from '@/app/scope/evals/page';
import { ScopeCoverage } from '@/components/scope/coverage/ScopeCoverage';
import { DatasetBrowser } from '@/components/scope/dataset/DatasetBrowser';
import { ScopeEvalsReport } from '@/components/scope/evals/ScopeEvalsReport';
import { RagBridge } from '@/components/scope/RagBridge';
import { SCOPE } from '@/content/scope';
import type { ScopeEvalResults } from '@/lib/generated/scope-evals';
import { clearDatasetCache } from '@/lib/scope/api';
import { publishedScopeResults } from '@/lib/scope/evals';

import illustrative from './fixtures/scope/evals-illustrative.json';
import { stubScopeFetch } from './scope-fixtures';

const D = SCOPE.dataset;
const E = SCOPE.evals;
const C = SCOPE.coverage;
const results = publishedScopeResults!;
// An offline run (`highnet-scope-evals run --fake`) with all five methods: its numbers are
// illustrative and only exercise the page.
const withDecide = illustrative as ScopeEvalResults;

beforeEach(() => clearDatasetCache());
afterEach(() => vi.unstubAllGlobals());

describe('scope dataset page', () => {
  it('filters the labeled prompts by preset, class, text and tag', async () => {
    stubScopeFetch();
    render(<ScopeDatasetPage />);
    expect(screen.getByText(D.loading)).toBeInTheDocument();
    expect(await screen.findByText(D.shown(300, 300))).toBeInTheDocument();
    expect(screen.getByText(D.provenance)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(40);

    fireEvent.click(screen.getByRole('button', { name: /off scope/ }));
    expect(screen.getByText(D.shown(80, 300))).toBeInTheDocument();
    expect(window.location.search).toBe('?preset=career&label=out');
    fireEvent.click(screen.getByRole('button', { name: /All classes/ }));

    fireEvent.click(screen.getByRole('button', { name: D.showMore(40) }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'multilingual' } });
    expect(screen.getByText(D.shown(48, 300))).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz-nothing' } });
    expect(screen.getByText(D.none)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: D.clear }));
    expect(screen.getByText(D.shown(300, 300))).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'career-0016' } });
    expect(screen.getByText(D.shown(1, 300))).toBeInTheDocument();
    expect(screen.getByText(D.earlier)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'COVER_LETTER' } });
    expect(screen.queryByText(D.none)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'RAG corpus assistant' }));
    expect(window.location.search).toBe('?preset=rag&q=COVER_LETTER');
  });

  it('ignores a load that lands after the page has gone', async () => {
    stubScopeFetch();
    const { unmount } = render(<DatasetBrowser />);
    unmount();
    await act(async () => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('gone'))),
    );
    clearDatasetCache();
    const again = render(<DatasetBrowser />);
    again.unmount();
    await act(async () => undefined);
    expect(screen.queryByText(/gone/)).not.toBeInTheDocument();
  });

  it('opens a shared link and says when the prompts cannot load', async () => {
    window.history.replaceState(
      null,
      '',
      '/scope/dataset/?preset=bank&label=injection&tag=encoded',
    );
    stubScopeFetch();
    const { unmount } = render(<DatasetBrowser />);
    expect(await screen.findByText(D.shown(6, 300))).toBeInTheDocument();
    unmount();
    clearDatasetCache();
    window.history.replaceState(null, '', '/scope/dataset/?preset=nope&label=nope');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    );
    render(<DatasetBrowser />);
    expect(await screen.findByText(D.error('The dataset answered 500.'))).toBeInTheDocument();
    stubScopeFetch();
    fireEvent.click(screen.getByRole('button', { name: D.retry }));
    expect(await screen.findByText(D.shown(300, 300))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Career agent', pressed: true })).toBeVisible();
  });
});

describe('scope coverage page', () => {
  it('marks sparse cells and misclassified prompts per preset', async () => {
    stubScopeFetch();
    render(<ScopeCoveragePage />);
    expect(await screen.findByText(C.missed(25))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `${C.open}: career-0013` })).toHaveAttribute(
      'href',
      '/scope/dataset/?preset=career&q=career-0013',
    );
    fireEvent.click(screen.getByRole('button', { name: C.showCells }));
    expect(screen.getByRole('table', { name: C.cellsCaption })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'RAG corpus assistant' }));
    expect(window.location.search).toBe('?preset=rag');
    expect(screen.getByText(C.missed(46))).toBeInTheDocument();
  });

  it('works without a published run and when a preset has no misses', async () => {
    window.history.replaceState(null, '', '/scope/coverage/?preset=bank');
    stubScopeFetch();
    const { unmount } = render(<ScopeCoverage results={null} />);
    expect(await screen.findAllByText(C.noResults)).not.toHaveLength(0);
    unmount();
    render(<ScopeCoverage results={{ ...results, misclassified: [] }} />);
    expect(await screen.findByText(C.missedNone)).toBeInTheDocument();
  });

  it('says when the map cannot load, and retries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject('offline')),
    );
    render(<ScopeCoverage results={results} />);
    expect(await screen.findByText(/offline/)).toBeInTheDocument();
    stubScopeFetch();
    fireEvent.click(screen.getByRole('button', { name: D.retry }));
    expect(await screen.findByText(C.missed(25))).toBeInTheDocument();
  });
});

describe('scope bridge', () => {
  it('draws nothing without its two examples', () => {
    const { container } = render(<RagBridge examples={[]} disabled={false} onPick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('scope evals page', () => {
  it('renders every number from the published run', () => {
    render(<ScopeEvalsPage />);
    expect(screen.getByText('$0.7796 in total')).toBeInTheDocument();
    expect(screen.getByText(/the LLM judge alone beats the default fused pipeline/)).toBeVisible();
    expect(screen.getByText(E.finding.why)).toBeInTheDocument();
    const confusion = screen.getByRole('table', { name: /Fused: label/ });
    expect(within(confusion).getByText('386')).toBeInTheDocument();
    expect(screen.getAllByText('14 of 240').length).toBe(1);
    expect(screen.getByText(E.method.abstained('Rules', 514))).toBeInTheDocument();
    expect(screen.getByText(E.method.failed('LLM judge', 20))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: E.method.details })).toHaveAttribute(
      'href',
      'https://github.com/highnet/highnet-safe-llm-tools/blob/main/evals/results/scope/2026-10-29.details.jsonl',
    );
    fireEvent.click(screen.getByRole('button', { name: E.sweep.showTable }));
    expect(screen.getByRole('rowheader', { name: '0.40' })).toBeInTheDocument();
  });

  it('says when no run is published, when it is illustrative, and when fusion wins', () => {
    const { unmount } = render(<ScopeEvalsReport results={null} />);
    expect(screen.getByText(E.empty)).toBeInTheDocument();
    unmount();
    const fusedWins: ScopeEvalResults = {
      ...results,
      run: { ...results.run, illustrative: true },
      methods: results.methods.map((m) =>
        m.method === 'fused'
          ? {
              ...m,
              rates: { ...m.rates, accuracy: 0.99 },
              classes: m.classes.map((c) => ({ ...c, precision: null, recall: null })),
            }
          : m,
      ),
    };
    render(<ScopeEvalsReport results={fusedWins} />);
    expect(screen.getByText(E.illustrative)).toBeInTheDocument();
    expect(
      screen.getByText(E.finding.fusedWins('99.0%', 'the LLM judge', '93.8%')),
    ).toBeInTheDocument();
    expect(screen.queryByText(E.finding.why)).not.toBeInTheDocument();
    expect(screen.getAllByText(E.classes.none).length).toBe(8);
  });

  it('scores the second judge as its own method and names the best signal from the file', () => {
    const run: ScopeEvalResults = {
      ...withDecide,
      methods: withDecide.methods.map((m) => (m.method === 'decide' ? { ...m, failed: 3 } : m)),
    };
    render(<ScopeEvalsReport results={run} />);
    const byName = (m: string) => withDecide.methods.find((x) => x.method === m)!;
    // The offline run's best single signal is kNN, and it beats the fused default.
    expect(
      screen.getByText(/In this run kNN alone beats the default fused pipeline/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        E.finding.judges(
          SCOPE.pct(byName('judge').rates.accuracy),
          '$0',
          SCOPE.pct(byName('decide').rates.accuracy),
          '$0',
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(SCOPE.methods.decide).length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText(/fake-judge, fake-decider/)).toBeInTheDocument();
    expect(screen.getByText(E.method.failed(SCOPE.methods.decide, 3))).toBeInTheDocument();
  });

  it('leaves the two-judge line out when a run has only one judge', () => {
    render(
      <ScopeEvalsReport
        results={{
          ...withDecide,
          methods: withDecide.methods.filter((m) => m.method !== 'decide'),
        }}
      />,
    );
    expect(screen.queryByText(/The two judges side by side/)).toBeNull();
  });
});
