import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HomePage from '@/app/page';
import { ClassMark } from '@/components/ui/ClassMark';
import { LANDING } from '@/content/landing';
import { SITE } from '@/content/site';
import verdicts from '@/lib/generated/scope-verdicts.json';
import * as verdictLib from '@/lib/scope-verdicts';
import { scopeRunHref, verdictForExample, verdictForQuestion } from '@/lib/scope-verdicts';
import { questionHref } from '@/lib/url-state';

describe('landing page', () => {
  it('introduces both products by their real steps and links into each', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(LANDING.title);
    // No product is current on the landing page, and no product's own pages are listed up top.
    const products = screen.getByRole('navigation', { name: SITE.productsLabel });
    for (const link of within(products).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
    const rag = screen.getByRole('list', { name: SITE.products.rag.name });
    expect(within(rag).getAllByRole('listitem')).toHaveLength(12);
    expect(rag).toHaveTextContent(LANDING.rag.result);
    const scope = screen.getByRole('list', { name: SITE.products.scope.name });
    expect(within(scope).getAllByRole('listitem')).toHaveLength(12);
    for (const action of LANDING.scope.actions) expect(scope).toHaveTextContent(action);
    expect(screen.getByRole('link', { name: LANDING.rag.open })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/rag\/?$/),
    );
    expect(screen.getByRole('link', { name: LANDING.scope.open })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/scope\/?$/),
    );
  });

  it('shows the recorded Scope verdicts for the two worked questions', () => {
    render(<HomePage />);
    const worldCup = verdictForExample('rag-world-cup')!;
    expect(
      screen.getAllByText(new RegExp(`fused confidence ${worldCup.confidence.toFixed(2)}`)),
    ).not.toHaveLength(0);
    // Links compare without the trailing slash Next may drop from the path in tests.
    const href = (name: RegExp) => screen.getAllByRole('link', { name })[0].getAttribute('href');
    const bare = (url: string) => url.replace('/?', '?');
    expect(bare(href(/See Scope decide/)!)).toBe(bare(scopeRunHref('rag-world-cup')));
    expect(bare(href(/See RAG abstain/)!)).toBe(
      bare(questionHref(LANDING.connect.worldCup.question)),
    );
  });
});

describe('landing page without recorded verdicts', () => {
  it('leaves the verdict line out rather than inventing one', () => {
    const spy = vi.spyOn(verdictLib, 'verdictForExample').mockReturnValue(undefined);
    render(<HomePage />);
    expect(screen.queryByText(/Recorded Scope verdict/)).toBeNull();
    spy.mockRestore();
  });
});

describe('scope verdicts and marks', () => {
  it('reads verdicts by question and by example, and nothing for unknown ids', () => {
    expect(verdictForQuestion('normandy')).toEqual(verdicts.verdicts.normandy);
    expect(verdictForExample('rag-normandy')).toEqual(verdicts.examples['rag-normandy']);
    expect(verdictForQuestion('nope')).toBeUndefined();
    expect(scopeRunHref('rag a')).toBe('/scope/?preset=rag&example=rag%20a');
    expect(questionHref('Who won?')).toBe('/rag/?q=Who%20won%3F');
  });

  it('draws one shape per class', () => {
    const { container } = render(
      <>
        <ClassMark label="in" />
        <ClassMark label="adjacent" size="sm" />
        <ClassMark label="out" size="lg" />
        <ClassMark label="injection" />
      </>,
    );
    const marks = container.querySelectorAll('[data-slot="class-mark"]');
    expect(marks).toHaveLength(4);
    expect(marks[0].querySelector('circle')).not.toBeNull();
    expect(marks[2].querySelector('rect')).not.toBeNull();
  });
});
