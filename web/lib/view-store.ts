'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

import { parseView, type View } from './view';

export type { View };

// A pipeline page's view (lib/view.ts) is shared by the header's toggle and the page below it, so
// it lives in this small store instead of either component. It starts from the link; the page
// writes every change back to the link (useViewLink).
let current: View | null = null;
const listeners = new Set<() => void>();

export const getView = (): View => {
  if (current === null) current = parseView(window.location.search);
  return current;
};

export const setView = (view: View) => {
  if (view === getView()) return;
  current = view;
  listeners.forEach((listener) => listener());
};

export const subscribeView = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// The static page is rendered in the Simple view, the default, and hydrates in it too (this is
// the server snapshot); a link to every step switches right after hydration.
const serverView = (): View => 'simple';

export const useView = () => useSyncExternalStore(subscribeView, getView, serverView);

// Forget the view, so the next read starts from the link again (a new page, or a test).
export const resetView = () => {
  current = null;
};

// Only the view changes: the rest of the link stays exactly as it was.
export const writeView = (view: View) => {
  const params = new URLSearchParams(window.location.search);
  if (view === 'steps') params.set('view', 'steps');
  else params.delete('view');
  const search = params.toString();
  window.history.replaceState(
    null,
    '',
    (search ? `?${search}` : window.location.pathname) + window.location.hash,
  );
};

// The page that owns the link: every change of view, from the page or the header, is written
// back. The returned function opens every step and, once it is drawn, scrolls to `target`.
export const useViewLink = () => {
  const scrollTo = useRef<string | null>(null);
  useEffect(
    () =>
      subscribeView(() => {
        writeView(getView());
        const target = scrollTo.current;
        scrollTo.current = null;
        if (target) {
          requestAnimationFrame(() =>
            document.getElementById(target)?.scrollIntoView?.({ block: 'start' }),
          );
        }
      }),
    [],
  );
  return (target: string) => {
    scrollTo.current = target;
    setView('steps');
  };
};
