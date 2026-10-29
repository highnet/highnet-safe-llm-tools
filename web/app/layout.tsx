import type { Metadata, Viewport } from 'next';
import { Recursive } from 'next/font/google';
import { type ReactNode } from 'react';

import { themeScript } from '@/components/site/ThemeToggle';
import { SITE } from '@/content/site';
import { SITE_DESCRIPTION, SITE_URL, structuredData } from '@/lib/site';

import './globals.css';

const recursive = Recursive({
  subsets: ['latin'],
  axes: ['CASL', 'MONO', 'slnt'],
  variable: '--font-recursive',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE.name,
  authors: [{ name: 'highnet', url: 'https://highnet.at' }],
  keywords: [
    'RAG',
    'retrieval-augmented generation',
    'LLM safety',
    'prompt injection',
    'scope guard',
    'LLM judge',
    'BM25',
    'vector search',
    'reranking',
    'Claude',
  ],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef3e4' },
    { media: '(prefers-color-scheme: dark)', color: '#121913' },
  ],
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en" className={recursive.variable} suppressHydrationWarning>
      <body>
        {/* The theme script opens the body rather than sitting in <head>: it still runs before
            anything is painted, and <head> then holds nothing React has to hydrate. A
            React-rendered script in <head> made hydration intermittently resume with its cursor
            still in <head> on deployments with a deployment id (Vercel), so the header was
            compared with <meta charset> and the page threw React error #418. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
};

export default RootLayout;
