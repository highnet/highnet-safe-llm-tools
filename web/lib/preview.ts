// Plain one-line text for picker cards and short quotes. Display only: the run itself always
// uses the message exactly as recorded.

const ELLIPSIS = '…';

const cut = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}${ELLIPSIS}` : text;

// Markup tags dropped, every run of whitespace (line breaks included) collapsed to one space, and
// capped at `max` characters. A message that is nothing but markup keeps its raw text.
export const oneLine = (text: string, max = 160): string => {
  const collapse = (s: string) => s.replace(/\s+/g, ' ').trim();
  const flat = collapse(text.replace(/<[^>]*>/g, ' '));
  return cut(flat || collapse(text), max);
};

// The first sentence of a passage, on one line, capped at `max` characters.
export const firstSentence = (text: string, max = 140): string => {
  const flat = oneLine(text, Number.MAX_SAFE_INTEGER);
  const end = flat.search(/[.!?](\s|$)/);
  return cut(end === -1 ? flat : flat.slice(0, end + 1), max);
};
