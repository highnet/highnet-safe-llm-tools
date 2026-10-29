'use client';

import { type ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type DisclosureProps = {
  show: string;
  hide: string;
  children: ReactNode;
  className?: string;
};

// A pencil toggle that opens a table alternative or a long verbatim block in place.
const Disclosure = ({ show, hide, children, className }: DisclosureProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div data-slot="disclosure" className={className}>
      <Button
        variant="pencil"
        size="inline"
        aria-expanded={open}
        className="min-h-8 gap-1 text-sm"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown aria-hidden className={cn('transition-transform', open && 'rotate-180')} />
        {open ? hide : show}
      </Button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
};

export { Disclosure };
