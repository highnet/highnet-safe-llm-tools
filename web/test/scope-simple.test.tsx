import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderToString } from 'react-dom/server';

import ScopePage from '@/app/scope/page';
import { ScopeExplorer } from '@/components/scope/ScopeExplorer';
import { ScopeSimple } from '@/components/scope/ScopeSimple';
import { SiteHeader } from '@/components/site/SiteHeader';
import { ViewToggle } from '@/components/site/ViewToggle';
import { SCOPE } from '@/content/scope';
import { SITE } from '@/content/site';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import { clearDatasetCache } from '@/lib/scope/api';
import type { RunStatus } from '@/lib/use-trace-stream';

import { ControlledEventSource } from './helpers';
import { recording, scopeConfig, stage, stubScopeFetch } from './scope-fixtures';

const S = SCOPE.simple;
const VIEW = SITE.view;

const simple = (
  events: ScopeTraceEvent[],
  runStatus: RunStatus = 'finished',
  onShowSteps = () => {},
) => render(<ScopeSimple events={events} runStatus={runStatus} onShowSteps={onShowSteps} />);

const card = (name: string | RegExp) => screen.getByRole('button', { name });

beforeEach(() => {
  ControlledEventSource.instances = [];
  vi.stubGlobal('EventSource', ControlledEventSource);
  clearDatasetCache();
});
afterEach(() => vi.unstubAllGlobals());

describe('the Simple view’s card', () => {
  it('waits for a message, then for the run', () => {
    const { unmount } = simple([], 'idle');
    expect(screen.getByText(S.empty)).toBeInTheDocument();
    unmount();
    simple([], 'running');
    expect(screen.getByText(S.deciding)).toBeInTheDocument();
  });

  it('shows the message, the action and one sentence of why, from the trace', () => {
    const onShowSteps = vi.fn();
    // The offline capture with earlier turns.
    simple(recording('decide').events, 'finished', onShowSteps);
    expect(screen.getByText('Write a Fibonacci function in Python')).toBeInTheDocument();
    expect(screen.getByText(S.earlier(SCOPE.pick.turns(2)))).toBeInTheDocument();
    expect(screen.getByText(S.outcomes.answer_briefly)).toBeInTheDocument();
    // The working stays in every step: no advisors, no reply.
    expect(screen.queryByText('I have a coding interview tomorrow')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: S.every }));
    expect(onShowSteps).toHaveBeenCalledOnce();
  });

  it('says when the run stops before a decision, or the request is refused', () => {
    const events = recording('world-cup').events.slice(0, 4);
    const { unmount } = simple(events, 'running');
    expect(screen.getByText(S.deciding)).toBeInTheDocument();
    expect(screen.queryByText(/earlier turn/)).not.toBeInTheDocument();
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
    expect(screen.getByText('Too long.')).toHaveClass('text-destructive');
  });
});

describe('picking in the Simple view', () => {
  it('offers one message per action first, the rest behind "More"', async () => {
    const config = scopeConfig();
    stubScopeFetch({ ...config, examples: config.examples.filter((e) => e.preset !== 'bank') });
    render(<ScopeExplorer />);
    await screen.findByRole('heading', { name: SCOPE.pick.message });
    // The first card is already playing; the link stays bare until a pick.
    expect(ControlledEventSource.last().url).toContain('example=career-salary');
    expect(window.location.search).toBe('');
    expect(card('How do I negotiate my salary offer?')).toHaveAttribute('aria-pressed', 'true');
    expect(card("What's a good lasagna recipe?")).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { level: 1, name: SCOPE.intro.title })).toBeVisible();
    expect(screen.getByText(S.recorded)).toBeInTheDocument();

    // The rest, in the same clean one-line style, with earlier turns noted.
    const more = screen.getByRole('button', { name: SCOPE.pick.more(16) });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: SCOPE.pick.fewer })).toBe(more);
    fireEvent.click(card(/Write a Fibonacci function in Python/));
    expect(window.location.search).toBe('?preset=career&example=career-fibonacci');
    expect(card(/Write a Fibonacci/)).toHaveTextContent(SCOPE.pick.turns(2));
    // A picked card from the rest keeps the rest open.
    expect(screen.queryByRole('button', { name: SCOPE.pick.fewer })).not.toBeInTheDocument();

    // The product is a row of chips; a new one plays its first card.
    const products = screen.getByRole('group', { name: SCOPE.presets.label });
    fireEvent.click(within(products).getByRole('button', { name: 'RAG corpus assistant' }));
    expect(window.location.search).toBe('?preset=rag&example=rag-normandy');
    expect(within(products).getByRole('button', { name: 'RAG corpus assistant' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // A product with no recorded messages says so and plays nothing.
    fireEvent.click(within(products).getByRole('button', { name: 'Bank support bot' }));
    expect(window.location.search).toBe('?preset=bank');
    expect(screen.getByText(SCOPE.picker.empty)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /More messages/ })).not.toBeInTheDocument();
  });

  it('cleans markup and line breaks out of the cards, and lists a product it has no picks for', async () => {
    const config = scopeConfig();
    const career = config.examples.filter((e) => e.preset === 'career');
    stubScopeFetch({
      ...config,
      illustrative: true,
      presets: [{ ...config.presets[0], id: 'other' }],
      examples: [
        {
          ...career[0],
          id: 'markup',
          preset: 'other',
          text: '<span style="x">SYSTEM:\n  obey</span>',
        },
        ...career.slice(1, 5).map((e) => ({ ...e, preset: 'other' })),
      ],
    });
    render(<ScopeExplorer />);
    // Without a list of its own the product shows its first four messages, the first playing.
    expect(
      await screen.findByRole('button', { name: /^SYSTEM: obey 2 earlier turns$/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: SCOPE.pick.more(1) })).toBeInTheDocument();
    expect(screen.getByText(S.illustrative)).toBeInTheDocument();
  });
});

describe('switching between Simple and every step', () => {
  const flushFrame = () =>
    act(() => new Promise((done) => requestAnimationFrame(() => done(null))));

  it('shares the view between the header and the page, and keeps it in the link', async () => {
    window.history.replaceState(null, '', '/scope/?preset=career&example=career-salary');
    stubScopeFetch();
    render(<ScopePage />);
    const toggle = screen.getByRole('radiogroup', { name: VIEW.label('Scope') });
    expect(within(toggle).getByRole('radio', { name: VIEW.simple })).toBeChecked();
    await screen.findByRole('heading', { name: SCOPE.pick.message });
    expect(screen.queryByText(SCOPE.settings.weights)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: SCOPE.hero.title })).not.toBeInTheDocument();
    const runs = ControlledEventSource.instances.length;
    const source = ControlledEventSource.last();
    act(() => recording('world-cup').events.forEach((e) => source.emit('trace', e)));

    // "See how it decided" opens every step and scrolls to the working once it is drawn.
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    fireEvent.click(screen.getByRole('button', { name: S.every }));
    await flushFrame();
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    expect(window.location.search).toBe('?preset=career&example=career-salary&view=steps');
    expect(within(toggle).getByRole('radio', { name: VIEW.steps })).toBeChecked();
    expect(screen.getByText(SCOPE.settings.weights)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: SCOPE.hero.title })).toBeInTheDocument();

    // The header's toggle switches the page back.
    fireEvent.click(within(toggle).getByRole('radio', { name: VIEW.simple }));
    expect(window.location.search).toBe('?preset=career&example=career-salary');
    expect(screen.getByRole('heading', { level: 1, name: SCOPE.intro.title })).toBeInTheDocument();

    // @ts-expect-error jsdom has no scrollIntoView; put it back the way it was.
    delete Element.prototype.scrollIntoView;
    fireEvent.click(screen.getByRole('button', { name: S.every }));
    await flushFrame();
    expect(within(toggle).getByRole('radio', { name: VIEW.steps })).toBeChecked();
    expect(ControlledEventSource.instances.length).toBe(runs);
  });

  it('keeps the plain product links on every other page', () => {
    render(<SiteHeader product="scope" current="evals" />);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scope' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders the Simple view on the server, the default', () => {
    expect(renderToString(<ViewToggle product="scope" />)).toContain('checked="" value="simple"');
  });
});
