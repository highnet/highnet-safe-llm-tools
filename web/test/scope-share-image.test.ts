// @vitest-environment node
// Scope's share card is drawn by the build in Node, so it is tested there.
import { describe, expect, it } from 'vitest';

import { GET as scopeShareImage } from '@/app/scope/og.png/route';

describe('scope share card', () => {
  it('draws a 1200×630 PNG', async () => {
    const response = scopeShareImage();
    expect(response.headers.get('content-type')).toBe('image/png');
    const png = new Uint8Array(await response.arrayBuffer());
    const view = new DataView(png.buffer);
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
  });
});
