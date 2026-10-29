import { readFileSync } from 'node:fs';
import path from 'node:path';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RagPage from '@/app/rag/page';
import { PipelineExplorer } from '@/components/pipeline/PipelineExplorer';
import { RagSimple } from '@/components/pipeline/RagSimple';
import { COPY } from '@/content/copy';
import { SITE } from '@/content/site';
import type { DemoQuestion } from '@/lib/api';
import { setView } from '@/lib/view-store';

import { ControlledEventSource, ev } from './helpers';

const S = COPY.simple;
const base = JSON.parse(readFileSync(path.join(__dirname, 'fixtures/config.json'), 'utf8'));
const questions: DemoQuestion[] = [
  { id: 'normandy', question: 'In what country is Normandy located?', compound: false },
  { id: 'fresno', question: 'What does the name Fresno mean in Spanish?', compound: false },
  { id: 'yuan', question: 'Who started the Yuan dynasty?', compound: false },
  { id: 'world-cup', question: 'Who won the 2018 FIFA World Cup?', compound: false },
  { id: 'two', question: 'Which was founded first,\n  Harvard or Chicago?', compound: true },
];

const withConfig = (overrides: Record<string, unknown> = {}) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            ...base,
            live: false,
            illustrative: false,
            questions,
            recorded: { ks: [3, 5, 10], at: '2026-09-28T21:00:00+00:00' },
            ...overrides,
          }),
        ),
    ),
  );

const url = () => new URL(ControlledEventSource.last().url, 'http://x');
const cite = (rank: number, title: string, text: string) => ({
  block: 1,
  chunk_id: 100 + rank,
  doc_title: title,
  rank,
  cited_text: text,
});
// A citations step in the API's shape: the answer as blocks, each with the ranks it cites.
const citations = ev('citations', {
  abstained: false,
  citations: [
    cite(2, 'Normans', 'Normandy is a region in France. It was named after the Normans.'),
    cite(2, 'Normans', 'The same passage, cited twice.'),
    cite(4, 'France', 'No full stop here'),
    cite(5, 'Paris', 'Third source.'),
    cite(7, 'Seine', 'A fourth source is left out.'),
  ],
  blocks: [
    { text: 'Normandy is in France.', cited: true, citation_ids: [2, 4] },
    { text: ' Its capital is Rouen.', cited: false, citation_ids: [] },
  ],
  unused_chunk_ids: [],
});

beforeEach(() => {
  ControlledEventSource.instances = [];
  vi.stubGlobal('EventSource', ControlledEventSource);
});
afterEach(() => vi.unstubAllGlobals());

describe('the RAG Simple view', () => {
  it('plays the first recorded question at once and answers it in one card', async () => {
    withConfig();
    render(<PipelineExplorer />);
    await screen.findByRole('heading', { name: S.pick });
    expect(screen.getByRole('heading', { level: 1, name: S.title })).toBeInTheDocument();
    expect(url().searchParams.get('question_id')).toBe('normandy');
    // The link stays bare until a pick.
    expect(window.location.search).toBe('');
    expect(screen.getByRole('button', { name: questions[0].question })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // No settings, steps or replay notice wall in Simple: one short line.
    expect(screen.queryByText(COPY.settings.topK)).not.toBeInTheDocument();
    expect(screen.getByText(S.recorded)).toBeInTheDocument();
    expect(screen.getByText(S.working)).toBeInTheDocument();

    // The answer streams in, then the citations step writes it out with its sources.
    const source = ControlledEventSource.last();
    act(() => source.emit('answer_delta', { text: 'Normandy is in' }));
    expect(screen.getByText('Normandy is in')).toBeInTheDocument();
    act(() => source.emit('trace', citations));
    expect(screen.getByText(/Its capital is Rouen\./)).toBeInTheDocument();
    expect(screen.getByText(`(${S.source(2)})`)).toBeInTheDocument();
    const sources = within(screen.getByRole('list', { name: S.sources }));
    expect(sources.getAllByRole('listitem')).toHaveLength(3);
    expect(sources.getByText('Normandy is a region in France.')).toBeInTheDocument();
    expect(sources.getByText('No full stop here')).toBeInTheDocument();
    expect(sources.queryByText('Seine')).not.toBeInTheDocument();

    // A card behind "More", cleaned to one line, replays its run and writes the link.
    fireEvent.click(screen.getByRole('button', { name: S.more(1) }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Which was founded first, Harvard or Chicago?' }),
    );
    expect(url().searchParams.get('question_id')).toBe('two');
    expect(window.location.search).toContain('q=Which+was+founded+first');
  });

  it('opens an old shared link on its own run, and switches to every step and back', async () => {
    window.history.replaceState(
      null,
      '',
      '/rag/?q=Who%20won%20the%202018%20FIFA%20World%20Cup%3F&mode=hybrid&k=5&chunks=medium',
    );
    withConfig();
    render(<RagPage />);
    const toggle = screen.getByRole('radiogroup', { name: SITE.view.label('RAG') });
    expect(within(toggle).getByRole('radio', { name: SITE.view.simple })).toBeChecked();
    await screen.findByRole('heading', { name: S.pick });
    expect(url().searchParams.get('question_id')).toBe('world-cup');
    expect(url().searchParams.get('k')).toBe('5');
    expect(screen.getByRole('button', { name: questions[3].question })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const runs = ControlledEventSource.instances.length;

    act(() =>
      ControlledEventSource.last().emit('done', {
        status: 'ok',
        ms: 1,
        tokens: 0,
        cost_usd: 0,
        stages: 1,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: S.every }));
    expect(within(toggle).getByRole('radio', { name: SITE.view.steps })).toBeChecked();
    expect(window.location.search).toContain('&view=steps');
    expect(screen.getByRole('heading', { name: COPY.workingLabel })).toBeInTheDocument();
    // A pick in every step keeps the view in the link.
    fireEvent.click(screen.getByRole('button', { name: questions[1].question }));
    expect(window.location.search).toMatch(/^\?q=What.*&view=steps$/);

    fireEvent.click(within(toggle).getByRole('radio', { name: SITE.view.simple }));
    expect(window.location.search).not.toContain('view=');
    expect(screen.getByRole('heading', { level: 1, name: S.title })).toBeInTheDocument();
    expect(ControlledEventSource.instances.length).toBe(runs + 1);
  });

  it('says when the recordings are illustrative, or there are none', async () => {
    withConfig({ illustrative: true });
    const { unmount } = render(<PipelineExplorer />);
    expect(await screen.findByText(S.illustrative)).toBeInTheDocument();
    unmount();
    withConfig({ questions: [] });
    render(<PipelineExplorer />);
    expect(await screen.findByText(COPY.replay.empty)).toBeInTheDocument();
    expect(ControlledEventSource.instances).toHaveLength(1);
    expect(screen.getByText(S.empty)).toBeInTheDocument();
  });

  it('keeps the question box, the budget notices and the retry on a live server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 502 })),
    );
    const { unmount } = render(<PipelineExplorer />);
    expect(screen.getByText(COPY.starting)).toBeInTheDocument();
    expect(await screen.findByText(new RegExp(COPY.offline))).toBeInTheDocument();
    withConfig({ live: true, illustrative: true, budget: { ...base.budget, tier: 'degraded' } });
    fireEvent.click(screen.getByRole('button', { name: COPY.retry }));
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(COPY.illustrative)).toBeInTheDocument();
    expect(screen.getByText(/80%|budget/i)).toBeInTheDocument();
    // Nothing plays on its own when questions are asked live.
    expect(ControlledEventSource.instances).toHaveLength(0);
    expect(screen.queryByText(S.recorded)).not.toBeInTheDocument();
    unmount();
    withConfig({ live: true, budget: { ...base.budget, tier: 'stopped' } });
    render(<PipelineExplorer />);
    expect(await screen.findByRole('textbox')).toBeDisabled();
  });

  it('plays the first question with the link’s settings, the agent only where it was recorded', async () => {
    window.history.replaceState(null, '', '/rag/?agent=1&k=3');
    withConfig({ questions: [questions[4], questions[0]] });
    const { unmount } = render(<PipelineExplorer />);
    await screen.findByRole('heading', { name: S.pick });
    expect(url().searchParams.get('agentic')).toBe('true');
    expect(url().searchParams.get('k')).toBe('3');
    unmount();
    withConfig();
    render(<PipelineExplorer />);
    await screen.findByRole('heading', { name: S.pick });
    expect(url().searchParams.get('agentic')).toBe('false');
  });

  it('does not play anything on its own in every step', async () => {
    setView('steps');
    withConfig();
    render(<PipelineExplorer />);
    await screen.findByRole('heading', { name: COPY.replay.pickLabel });
    expect(ControlledEventSource.instances).toHaveLength(0);
  });
});

describe('the RAG Simple card', () => {
  it('waits for a question, then for the answer, and says when the run stopped', () => {
    const props = { citations: undefined, streamed: '', onShowSteps: () => {} };
    const { rerender } = render(<RagSimple question={null} runStatus="idle" {...props} />);
    expect(screen.getByText(S.empty)).toBeInTheDocument();
    rerender(<RagSimple question={null} runStatus="running" {...props} />);
    expect(screen.getByText(S.working)).toBeInTheDocument();
    rerender(<RagSimple question="Where?" runStatus="failed" {...props} />);
    expect(screen.getByText(S.stopped)).toBeInTheDocument();
    expect(screen.queryByText(S.sources)).not.toBeInTheDocument();
  });
});
