'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { COPY } from '@/content/copy';

const STORAGE_KEY = 'highnet-rag-theme';

// The theme lives on <html class="dark">; subscribe to it instead of copying it into state.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains('dark');
const isDarkOnServer = () => false;

const ThemeToggle = () => {
  const dark = useSyncExternalStore(subscribe, isDark, isDarkOnServer);

  const toggle = () => {
    const next = !dark;
    // The choice also lives on data-theme, which React never renders, so it holds even when
    // storage is unavailable and the class is reset.
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this visit.
    }
  };

  const label = dark ? COPY.theme.toLight : COPY.theme.toDark;
  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={toggle}>
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
};

// Runs before paint so the pad never flashes the wrong theme. React owns <html className> and
// can reset it when a page re-renders from the root, dropping the class this script added; so the
// script keeps the class in line with the visitor's choice (data-theme, then storage) or the
// system setting whenever it changes. The toggle records its choice first, so it always wins.
const themeScript = `(function(){var r=document.documentElement;var want=function(){try{var t=r.dataset.theme||localStorage.getItem('${STORAGE_KEY}');return t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;}catch(e){return false;}};var apply=function(){var d=want();if(r.classList.contains('dark')!==d)r.classList.toggle('dark',d);};apply();try{new MutationObserver(apply).observe(r,{attributes:true,attributeFilter:['class']});}catch(e){}})();`;

export { ThemeToggle, themeScript };
