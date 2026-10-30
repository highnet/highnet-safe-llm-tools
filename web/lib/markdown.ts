// A small Markdown reader for recorded model answers: paragraphs, headings, bullet and numbered
// lists, and inline **bold**, *italic* and `code`. It returns plain data; the component renders
// React elements from it, so no answer text is ever injected as HTML.

export type Inline = { kind: 'text' | 'strong' | 'em' | 'code'; text: string };

export type Block =
  | { kind: 'heading'; inline: Inline[] }
  | { kind: 'paragraph'; inline: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] };

const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*)/;
const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export const parseInline = (text: string): Inline[] =>
  text
    .split(INLINE)
    .filter((part) => part !== '')
    .map((part): Inline => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return { kind: 'strong', text: part.slice(2, -2) };
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return { kind: 'code', text: part.slice(1, -1) };
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return { kind: 'em', text: part.slice(1, -1) };
      }
      return { kind: 'text', text: part };
    });

export const parseMarkdown = (source: string): Block[] => {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: Inline[][] } | null = null;

  const flush = () => {
    if (paragraph.length)
      blocks.push({ kind: 'paragraph', inline: parseInline(paragraph.join(' ')) });
    if (list) blocks.push({ kind: 'list', ...list });
    paragraph = [];
    list = null;
  };

  for (const line of source.split(/\r?\n/)) {
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    if (!line.trim()) {
      flush();
    } else if (heading) {
      flush();
      blocks.push({ kind: 'heading', inline: parseInline(heading[1]) });
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (paragraph.length || (list && list.ordered !== ordered)) flush();
      list ??= { ordered, items: [] };
      list.items.push(parseInline((bullet ?? numbered)![1]));
    } else {
      if (list) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
};
