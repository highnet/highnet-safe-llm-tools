'use client';

import { type ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type DisclosureProps = {
  show: string;
  hide: string;
  // Omitted when the toggle opens content drawn elsewhere; `controls` then names it.
  children?: ReactNode;
  controls?: string;
  className?: string;
  // Controlled use: a parent that shows more than the children while open (a step's margin note).
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// A pencil toggle that opens more in place: a table alternative, a long verbatim block, or a
// step's details. Closed by default; the open state is never persisted.
const Disclosure = ({
  show,
  hide,
  children,
  controls,
  className,
  open,
  onOpenChange,
}: DisclosureProps) => {
  const [own, setOwn] = useState(false);
  const id = useId();
  const isOpen = open ?? own;
  const toggle = () => {
    setOwn(!isOpen);
    onOpenChange?.(!isOpen);
  };
  return (
    <div data-slot="disclosure" className={className}>
      <Button
        variant="pencil"
        size="inline"
        aria-expanded={isOpen}
        aria-controls={controls ?? id}
        className="min-h-8 gap-1 text-left text-sm whitespace-normal"
        onClick={toggle}
      >
        <ChevronDown aria-hidden className={cn('transition-transform', isOpen && 'rotate-180')} />
        {isOpen ? hide : show}
      </Button>
      {children !== undefined && (
        <div id={id} hidden={!isOpen} className="mt-2">
          {isOpen && children}
        </div>
      )}
    </div>
  );
};

export { Disclosure };
