import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RequestView } from '@/components/pipeline/stages/RequestView';
import { SCOPE_VERDICT } from '@/content/scope-verdict';
import type { RequestData } from '@/lib/stage-data';
import * as verdicts from '@/lib/scope-verdicts';

const request = {
  run_id: 'r',
  settings: { q: 'q', mode: 'hybrid', k: 5, chunk_set: 'medium', rerank: false, agentic: false },
  models: {
    embed: { provider: 'voyage', model: 'voyage-3.5-lite' },
    answer: { provider: 'anthropic', model: 'claude-haiku-4-5' },
  },
  rate_limit: { remaining_minute: 19, remaining_day: 199, limit_minute: 20, limit_day: 200 },
  budget: { spent_usd: 0, cap_usd: 20, remaining_usd: 20, degrade_at_usd: 16, tier: 'normal' },
} as unknown as RequestData;

describe('the Scope verdict in RAG’s first step', () => {
  it('shows the recorded verdict and links to its Scope run', () => {
    const verdict = verdicts.verdictForQuestion('normandy')!;
    render(<RequestView data={request} questionId="normandy" />);
    expect(screen.getByRole('heading', { name: SCOPE_VERDICT.title })).toBeInTheDocument();
    expect(screen.getByText(verdict.confidence.toFixed(2))).toBeInTheDocument();
    expect(screen.getByText(SCOPE_VERDICT.inScopeNotInCorpus)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: SCOPE_VERDICT.link }).getAttribute('href')).toContain(
      'example=rag-normandy',
    );
  });

  it('says when the judge’s reply failed validation, and when there is no verdict', () => {
    const { unmount } = render(<RequestView data={request} questionId="compound-03" />);
    expect(screen.getByText(SCOPE_VERDICT.judgeFailed)).toBeInTheDocument();
    unmount();
    render(<RequestView data={request} questionId="not-recorded" />);
    expect(screen.getByText(SCOPE_VERDICT.missing)).toBeInTheDocument();
  });

  it('leaves out the in-scope note when Scope redirected or blocked', () => {
    const base = verdicts.verdictForQuestion('normandy')!;
    const spy = vi.spyOn(verdicts, 'verdictForQuestion');
    for (const action of ['redirect', 'block'] as const) {
      spy.mockReturnValue({ ...base, action });
      const { unmount } = render(<RequestView data={request} questionId="normandy" />);
      expect(screen.queryByText(SCOPE_VERDICT.inScopeNotInCorpus)).toBeNull();
      unmount();
    }
    spy.mockRestore();
  });

  it('shows nothing about Scope when the request itself failed', () => {
    render(
      <RequestView
        data={{ ...request, error: { type: 'rate_limited', message: 'Slow down.' } }}
        questionId="normandy"
      />,
    );
    expect(screen.queryByText(SCOPE_VERDICT.title)).toBeNull();
  });
});
