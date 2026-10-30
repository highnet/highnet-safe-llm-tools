import { type Inline, parseMarkdown } from '@/lib/markdown';
import { cn } from '@/lib/utils';

import { Typography } from './Typography';

const renderInline = (inline: Inline[]) =>
  inline.map((part, i) => {
    if (part.kind === 'strong') return <strong key={i}>{part.text}</strong>;
    if (part.kind === 'em') return <em key={i}>{part.text}</em>;
    if (part.kind === 'code') {
      return (
        <code key={i} className="voice-data text-[0.92em]">
          {part.text}
        </code>
      );
    }
    return part.text;
  });

type MarkdownProps = {
  source: string;
  className?: string;
};

// A recorded answer as the reader would see it in a chat: headings, lists and emphasis rendered,
// never raw asterisks. Built from parsed data (lib/markdown.ts), never from injected HTML.
const Markdown = ({ source, className }: MarkdownProps) => {
  return (
    <div data-slot="markdown" className={cn('space-y-2 wrap-anywhere', className)}>
      {parseMarkdown(source).map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <Typography key={i} as="p" className="font-semibold">
              {renderInline(block.inline)}
            </Typography>
          );
        }
        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul';
          return (
            <List
              key={i}
              className={cn('space-y-1 pl-5', block.ordered ? 'list-decimal' : 'list-disc')}
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </List>
          );
        }
        return <Typography key={i}>{renderInline(block.inline)}</Typography>;
      })}
    </div>
  );
};

export { Markdown };
