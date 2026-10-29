'use client';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SCOPE } from '@/content/scope';
import { type ScopeView } from '@/lib/scope/url-state';
import { setScopeView, useScopeView } from '@/lib/scope/view-store';

// Scope's two views, nested in the header's Scope segment on the Scope pipeline page. The page
// below follows the same store and writes the choice into the link.
const ScopeViewToggle = () => {
  const view = useScopeView();
  return (
    <>
      <span id="scope-view-label" className="sr-only">
        {SCOPE.view.label}
      </span>
      <SegmentedControl
        name="scope-view"
        labelledBy="scope-view-label"
        variant="inset"
        size="inset"
        value={view}
        onChange={(value) => setScopeView(value as ScopeView)}
        options={[
          { value: 'simple', label: SCOPE.view.simple },
          { value: 'steps', label: SCOPE.view.steps },
        ]}
      />
    </>
  );
};

export { ScopeViewToggle };
