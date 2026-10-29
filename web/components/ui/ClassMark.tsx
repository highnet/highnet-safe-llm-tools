import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Scope's four classes (and the action each leads to) as a shape in its class ink, so a mark is
// never colour alone. Each pair is the one its ink already has on the RAG pages, so an ink and
// shape mean one thing site-wide: in = green triangle, adjacent = blue circle, out = umber
// square, injection = violet diamond.
const classMarkVariants = cva('inline-block shrink-0', {
  variants: {
    label: {
      in: 'fill-class-in',
      adjacent: 'fill-class-adjacent',
      out: 'fill-class-out',
      injection: 'fill-class-injection',
    },
    size: { default: 'size-3', sm: 'size-2.5', lg: 'size-3.5' },
  },
  defaultVariants: { size: 'default' },
});

const SHAPES = {
  in: <path d="M6 0.8 11.4 11H0.6Z" />,
  adjacent: <circle cx="6" cy="6" r="5" />,
  out: <rect x="1" y="1" width="10" height="10" />,
  injection: <path d="M6 0.5 11.5 6 6 11.5 0.5 6Z" />,
} as const;

export type ClassLabel = keyof typeof SHAPES;

type ClassMarkProps = VariantProps<typeof classMarkVariants> & {
  label: ClassLabel;
  className?: string;
};

const ClassMark = ({ label, size, className }: ClassMarkProps) => {
  return (
    <svg
      aria-hidden
      data-slot="class-mark"
      viewBox="0 0 12 12"
      className={cn(classMarkVariants({ label, size }), className)}
    >
      {SHAPES[label]}
    </svg>
  );
};

export { ClassMark, classMarkVariants };
