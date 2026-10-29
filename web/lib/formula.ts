import { KEY, type KeyEntry } from '@/content/formal';

export type FormulaNode =
  | { kind: 'text'; text: string }
  | { kind: 'term'; symbol: string }
  | { kind: 'sub'; nodes: FormulaNode[] }
  | { kind: 'sup'; nodes: FormulaNode[] };

const TOKEN = /_\{([^}]*)\}|\^\{([^}]*)\}|([A-Za-z]+)|(\s+)|(.)/gu;

// Splits a formula into plain text, symbols from the key, `_{…}` subscripts and `^{…}`
// superscripts. `key` defaults to the RAG pipeline's symbols; Scope passes its own.
export const parseFormula = (source: string, key: Record<string, KeyEntry> = KEY): FormulaNode[] =>
  [...source.matchAll(TOKEN)].map(([, sub, sup, word, , char]): FormulaNode => {
    if (sub !== undefined) return { kind: 'sub', nodes: parseFormula(sub, key) };
    if (sup !== undefined) return { kind: 'sup', nodes: parseFormula(sup, key) };
    const symbol = word ?? char;
    if (symbol !== undefined && symbol in key) return { kind: 'term', symbol };
    return { kind: 'text', text: symbol ?? ' ' };
  });
