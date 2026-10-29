'use client';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { type ProductKey, SITE } from '@/content/site';
import { setView, useView, type View } from '@/lib/view-store';

type ViewToggleProps = {
  product: ProductKey;
};

// A pipeline page's two views, nested in the header's segment of its product. The page below
// follows the same store and writes the choice into the link (lib/view-store.ts).
const ViewToggle = ({ product }: ViewToggleProps) => {
  const view = useView();
  const labelId = `${product}-view-label`;
  return (
    <>
      <span id={labelId} className="sr-only">
        {SITE.view.label(SITE.products[product].name)}
      </span>
      <SegmentedControl
        name={`${product}-view`}
        labelledBy={labelId}
        variant="inset"
        size="inset"
        value={view}
        onChange={(value) => setView(value as View)}
        options={[
          { value: 'simple', label: SITE.view.simple },
          { value: 'steps', label: SITE.view.steps },
        ]}
      />
    </>
  );
};

export { ViewToggle };
