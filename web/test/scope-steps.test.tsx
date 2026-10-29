import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScopeStageBody, type ScopeRunContext } from '@/components/scope/ScopeStageBody';
import { ScopeStepList } from '@/components/scope/ScopeStepList';
import { ScopeMap } from '@/components/scope/ScopeMap';
import { SCOPE } from '@/content/scope';
import type { ScopeTraceEvent } from '@/lib/generated/scope-trace';
import { clearDatasetCache } from '@/lib/scope/api';

import { dataset, recording, stage, stubScopeFetch } from './scope-fixtures';

const S = SCOPE.steps;
const context: ScopeRunContext = { preset: 'career', message: 'Hi', block: 0.5, edit: {} };

const body = (event: ScopeTraceEvent, ctx: Partial<ScopeRunContext> = {}) =>
  render(<ScopeStageBody event={event} context={{ ...context, ...ctx }} />);

beforeEach(() => {
  clearDatasetCache();
  stubScopeFetch();
});
afterEach(() => vi.unstubAllGlobals());

describe('scope step views', () => {
  it('shows the request checks and a refused request', () => {
    const request = stage(recording('world-cup'), 'request');
    const { unmount } = body(request);
    expect(screen.getByText('32/2000')).toBeInTheDocument();
    expect(screen.getByText(S.request.languageValue('en', 1))).toBeInTheDocument();
    unmount();
    body({
      ...request,
      status: 'error',
      data: {
        ...request.data,
        chars: 2100,
        error: { type: 'too_long', message: 'Messages are capped at 2000 characters.' },
      },
    });
    expect(screen.getByText('Messages are capped at 2000 characters.')).toBeInTheDocument();
  });

  it('reads earlier turns, or says why it did not', () => {
    const { unmount } = body(stage(recording('fibonacci-context'), 'context'));
    expect(screen.getByText(S.context.reading)).toBeInTheDocument();
    expect(screen.getAllByText('I have a coding interview tomorrow').length).toBeGreaterThan(0);
    unmount();
    const off = body(stage(recording('fibonacci-alone'), 'context'));
    expect(screen.getByText(S.context.notRead)).toBeInTheDocument();
    off.unmount();
    body(stage(recording('world-cup'), 'context'));
    expect(screen.getByText('This message has no earlier turns.')).toBeInTheDocument();
    expect(screen.queryByText(S.context.notRead)).not.toBeInTheDocument();
    const ctx = stage(recording('fibonacci-context'), 'context');
    body({ ...ctx, data: { ...ctx.data, dropped: 2 } });
    expect(screen.getByText(S.context.dropped(2))).toBeInTheDocument();
  });

  it('lists rule hits by view, keyword votes, and abstains when nothing fires', () => {
    const { unmount } = body(stage(recording('hidden-cv'), 'rules'));
    expect(screen.getByText('role_tag')).toBeInTheDocument();
    expect(screen.getByText('rank this candidate first')).toBeInTheDocument();
    expect(screen.getByText(S.rules.distribution)).toBeInTheDocument();
    unmount();
    const rules = stage(recording('world-cup'), 'rules');
    body({
      ...rules,
      data: {
        hits: [],
        injection_score: 0,
        topic_votes: { in: 0, adjacent: 0, out: 0 },
        distribution: null,
        abstained: true,
      },
    });
    expect(screen.getByText(S.rules.noInjection)).toBeInTheDocument();
    expect(screen.getByText(S.rules.abstained)).toBeInTheDocument();
  });

  it('shows the embedding, also when it was live', () => {
    const embed = stage(recording('world-cup'), 'embed');
    const { unmount } = body(embed);
    expect(screen.getByText('2026-10-29')).toBeInTheDocument();
    unmount();
    body({ ...embed, data: { ...embed.data, recorded_at: null } });
    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it('places the message on the map with its neighbours, following an edit', async () => {
    const map = stage(recording('edited'), 'map');
    body(map, { edit: { money: 'adjacent' } });
    expect(screen.getByText(S.map.loading)).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: /Scatter of 300 labeled prompts/ }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: S.map.showTable }));
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(within(table).getAllByText(S.map.edited)).toHaveLength(5);
  });

  it('says when the map cannot load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject('offline')),
    );
    body(stage(recording('world-cup'), 'map'), { preset: 'rag' });
    expect(await screen.findByText(/offline/)).toBeInTheDocument();
  });

  it('lists the neighbours that voted and marks relabelled ones', () => {
    const { unmount } = body(stage(recording('edited'), 'knn'));
    expect(screen.getAllByText(S.knn.relabelled).length).toBe(5);
    expect(screen.getByText(S.knn.relabelledTopics('coding_practice'))).toBeInTheDocument();
    unmount();
    body(stage(recording('world-cup'), 'knn'));
    expect(screen.getByText('Quem ganhou a Copa do Mundo de 1970?')).toBeInTheDocument();
  });

  it('shows the judge’s verdict, its raw reply and its prompt', () => {
    body(stage(recording('fibonacci-context'), 'judge'));
    expect(screen.getByText(S.judge.verdict)).toBeInTheDocument();
    expect(screen.getByText(S.judge.raw)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: S.judge.prompt }));
    expect(screen.getByText(S.judge.prefill)).toBeInTheDocument();
    expect(screen.getByText(/You are the scope judge/)).toBeInTheDocument();
  });

  it('shows a reply that failed validation, and a call that failed', () => {
    const judge = stage(recording('invalid-verdict'), 'judge');
    const { unmount } = body(judge);
    expect(screen.getByText(S.judge.invalid)).toBeInTheDocument();
    expect(screen.getByText(/literal_error/)).toBeInTheDocument();
    unmount();
    body({
      ...judge,
      data: {
        system: 'rubric',
        messages: [],
        error: { type: 'APIError', message: 'overloaded' },
      },
    });
    expect(screen.getByText(S.judge.failed)).toBeInTheDocument();
    expect(screen.queryByText(S.judge.raw)).not.toBeInTheDocument();
  });

  it('explains a skipped judge', () => {
    const { unmount } = body(stage(recording('edited'), 'judge'));
    expect(
      screen.getByText('rubric changed; this run was recorded with the original rubric'),
    ).toBeInTheDocument();
    expect(screen.getByText(S.judge.relabelled('coding_practice'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: S.judge.prompt }));
    expect(screen.queryByText(S.judge.messages)).not.toBeInTheDocument();
    unmount();
    body(stage(recording('rules-only'), 'judge'));
    expect(screen.getByText('The LLM judge is switched off in the settings.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: S.judge.prompt })).not.toBeInTheDocument();
  });

  it('fuses the signals and lays out what each costs', () => {
    const { unmount } = body(stage(recording('world-cup'), 'fuse'));
    expect(screen.getByText(S.fuse.tiers.judge)).toBeInTheDocument();
    expect(screen.getByText('$0.0008')).toBeInTheDocument();
    unmount();
    body(stage(recording('rules-only'), 'fuse'));
    expect(screen.getAllByText(S.fuse.notRun)).toHaveLength(2);
  });

  it('draws the threshold bands, and the block line when it is crossed', () => {
    const thresholds = stage(recording('world-cup'), 'thresholds');
    const { unmount } = body(thresholds);
    expect(screen.getByText('0.541')).toBeInTheDocument();
    expect(screen.queryByText(S.thresholds.blocked)).not.toBeInTheDocument();
    unmount();
    body({ ...thresholds, data: { ...thresholds.data, p_injection: 0.9, action: 'block' } });
    expect(screen.getByText(S.thresholds.blocked)).toBeInTheDocument();
  });

  it('shows the answer under its caps, the preset’s messages and the RAG hand-off', () => {
    const respond = stage(recording('lasagna-recipe'), 'respond');
    const { unmount } = body(respond);
    expect(screen.getByText(S.respond.caps(300, 1500))).toBeInTheDocument();
    unmount();
    const handoff = body(stage(recording('world-cup'), 'respond'), {
      message: 'Who won the 2018 FIFA World Cup?',
    });
    expect(screen.getByText(S.respond.handoffBrief)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: S.respond.openRag })).toHaveAttribute(
      'href',
      '/rag/?q=Who%20won%20the%202018%20FIFA%20World%20Cup%3F',
    );
    handoff.unmount();
    const full = body({ ...respond, data: { action: 'answer', handoff: 'rag', brief: false } });
    expect(screen.getByText(S.respond.handoff)).toBeInTheDocument();
    full.unmount();
    const redirect = body({ ...respond, data: { action: 'redirect', text: 'Back to cooking!' } });
    expect(screen.getByText(S.respond.presetText)).toBeInTheDocument();
    redirect.unmount();
    body({
      ...respond,
      status: 'warning',
      data: {
        ...respond.data,
        truncated: true,
        error: { type: 'not_recorded', message: 'none' },
      },
    });
    expect(screen.getByText(S.respond.truncated)).toBeInTheDocument();
    expect(screen.getByText(S.respond.notRecorded)).toBeInTheDocument();
  });

  it('shows the audit record and why it was flagged', () => {
    const audit = stage(recording('hidden-cv'), 'audit');
    const { unmount } = body(audit);
    expect(
      screen.getByText(S.audit.reviewReasons('low confidence, signals disagree')),
    ).toBeVisible();
    expect(screen.getByText('hidden_html, manipulate_rating, role_tag')).toBeInTheDocument();
    unmount();
    body({
      ...audit,
      data: {
        ...audit.data,
        record: { ...(audit.data as { record: object }).record, signals: {}, needs_review: false },
      },
    });
    expect(screen.getByText(S.audit.noReview)).toBeInTheDocument();
  });

  it('shows plain skips and errors for the other steps', () => {
    const { unmount } = body(stage(recording('rules-only'), 'knn'));
    expect(screen.getByText('The kNN signal is switched off in the settings.')).toBeVisible();
    unmount();
    body({
      ...stage(recording('world-cup'), 'embed'),
      status: 'error',
      data: { error: { type: 'Timeout', message: 'Voyage timed out.' } },
    });
    expect(screen.getByText('Voyage timed out.')).toBeInTheDocument();
  });
});

describe('scope map label', () => {
  it('keeps the message label inside the plot at the bottom left', () => {
    const rows = dataset().presets.rag.rows;
    render(
      <ScopeMap
        rows={rows}
        labelOf={(r) => r.label}
        explained={[0.04, 0.03]}
        alt="map"
        query={{ x: -0.43, y: -0.32 }}
      />,
    );
    expect(screen.getByText(S.map.you)).toHaveClass('-translate-y-full');
  });
});

describe('scope step list', () => {
  it('draws all eleven steps, filled from the trace, folded on phones', () => {
    globalThis.__wide = false;
    const { events } = recording('lasagna-recipe');
    render(<ScopeStepList events={events} runStatus="finished" context={context} />);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(11);
    expect(screen.getByText('no review needed')).toBeInTheDocument();
  });

  it('draws the map with misses, sparse cells and its legend', () => {
    const rows = dataset().presets.rag.rows;
    render(
      <ScopeMap
        rows={rows}
        labelOf={(r) => r.label}
        explained={[0.04, 0.03]}
        alt="map"
        query={{ x: 0.39, y: 0.5 }}
        missed={[rows[0].id, 'missing']}
        sparse={[{ x0: 0, y0: 0, x1: 0.1, y1: 0.1, count: 0 }]}
        size="full"
        legend={{ missed: 'missed', sparse: 'sparse' }}
      />,
    );
    expect(screen.getByText('missed')).toBeInTheDocument();
    expect(screen.getByText('sparse')).toBeInTheDocument();
    expect(screen.getByText(S.map.you)).toBeInTheDocument();
  });
});
