import { useSyncExternalStore } from 'react';

import { parseScopeView, type ScopeView } from './url-state';

// Scope's view (Simple or every step) is shared by the header's toggle and the page below it, so
// it lives in this small store instead of either component. It starts from the link; the explorer
// writes every change back to the link (lib/scope/url-state.ts, writeScopeView).
let current: ScopeView | null = null;
const listeners = new Set<() => void>();

export const getScopeView = (): ScopeView => {
  if (current === null) current = parseScopeView(window.location.search);
  return current;
};

export const setScopeView = (view: ScopeView) => {
  if (view === getScopeView()) return;
  current = view;
  listeners.forEach((listener) => listener());
};

export const subscribeScopeView = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// The static page is rendered in the Simple view, the default; a link to every step switches
// right after hydration.
const serverView = (): ScopeView => 'simple';

export const useScopeView = () =>
  useSyncExternalStore(subscribeScopeView, getScopeView, serverView);

// Forget the view, so the next read starts from the link again (a new page, or a test).
export const resetScopeView = () => {
  current = null;
};
