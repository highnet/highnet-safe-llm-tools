import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Markdown } from '@/components/ui/Markdown';
import { parseInline, parseMarkdown } from '@/lib/markdown';

const ANSWER = [
  '**No, you are not obliged to share your salary.**',
  '',
  '## Why you might decline',
  '- Anchoring: a *lower* number can cap the offer',
  '- Privacy',
  '1. Say you prefer to discuss the role first',
  '2. Name a range with `market data`',
  'A closing line',
  'that wraps.',
].join('\n');

describe('markdown', () => {
  it('reads paragraphs, headings, both list kinds and inline emphasis', () => {
    expect(parseMarkdown(ANSWER).map((b) => b.kind)).toEqual([
      'paragraph',
      'heading',
      'list',
      'list',
      'paragraph',
    ]);
    const [, , bullets, numbered, closing] = parseMarkdown(ANSWER);
    expect(bullets).toMatchObject({ ordered: false });
    expect(numbered).toMatchObject({ ordered: true });
    expect(closing).toEqual({
      kind: 'paragraph',
      inline: [{ kind: 'text', text: 'A closing line that wraps.' }],
    });
    // A paragraph right before a list closes, and a list ends where a paragraph starts.
    expect(parseMarkdown('Intro\n- one').map((b) => b.kind)).toEqual(['paragraph', 'list']);
  });

  it('leaves lone markers as text', () => {
    expect(parseInline('a ** b * c')).toEqual([{ kind: 'text', text: 'a ** b * c' }]);
    expect(parseInline('**bold** and `x` and *it*')).toEqual([
      { kind: 'strong', text: 'bold' },
      { kind: 'text', text: ' and ' },
      { kind: 'code', text: 'x' },
      { kind: 'text', text: ' and ' },
      { kind: 'em', text: 'it' },
    ]);
  });

  it('renders the answer without raw markers', () => {
    const { container } = render(<Markdown source={ANSWER} />);
    expect(container.textContent).not.toContain('**');
    expect(screen.getByText('No, you are not obliged to share your salary.').tagName).toBe(
      'STRONG',
    );
    expect(screen.getByText('Why you might decline')).toBeInTheDocument();
    expect(container.querySelector('ul')?.children).toHaveLength(2);
    expect(container.querySelector('ol')?.children).toHaveLength(2);
    expect(screen.getByText('lower').tagName).toBe('EM');
    expect(screen.getByText('market data').tagName).toBe('CODE');
  });
});
