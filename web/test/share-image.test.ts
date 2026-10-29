// @vitest-environment node
// The share cards are drawn by the build in Node, so they are tested there (the PNG encoder does
// not run under jsdom).
import { describe, expect, it } from 'vitest';

import { GET as siteCard } from '@/app/og.png/route';
import { GET as ragCard } from '@/app/rag/og.png/route';

const size = async (response: Response) => {
  expect(response.headers.get('content-type')).toBe('image/png');
  const png = new Uint8Array(await response.arrayBuffer());
  // PNG signature, then the IHDR width and height.
  expect([...png.slice(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
  const view = new DataView(png.buffer);
  return [view.getUint32(16), view.getUint32(20)];
};

describe('share cards', () => {
  it('draws the site card and the RAG card as 1200×630 PNGs', async () => {
    expect(await size(siteCard())).toEqual([1200, 630]);
    expect(await size(ragCard())).toEqual([1200, 630]);
  });
});
