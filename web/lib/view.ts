// Each product's pipeline page has two views: Simple (the result in plain words, the default) and
// every step (`?view=steps`). Plain helpers only, so server code (links on other pages) can use
// them; the shared store with its hooks is lib/view-store.ts.
export type View = 'simple' | 'steps';

// Simple unless the link asks for every step.
export const parseView = (search: string): View =>
  new URLSearchParams(search).get('view') === 'steps' ? 'steps' : 'simple';
