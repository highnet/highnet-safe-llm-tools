import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import type { StageCopy } from '@/content/stages';
import { cn } from '@/lib/utils';

type WhyThisStepProps = {
  copy: StageCopy;
  layout: 'inline' | 'margin';
  className?: string;
};

// The blue-pencil note for each step, shown once its Details are open: why the step exists, then
// the technical layer in small muted prose.
const WhyThisStep = ({ copy, layout, className }: WhyThisStepProps) => {
  const detail = (
    <Typography variant="small" color="muted" className="max-w-[68ch]">
      {copy.detail}
    </Typography>
  );

  if (layout === 'margin') {
    return (
      <aside data-slot="why-this-step" className={cn('space-y-2 pt-5', className)}>
        <Typography variant="label" color="pencil" as="p">
          {COPY.why}
        </Typography>
        <Typography variant="marginNote">{copy.why}</Typography>
        {detail}
      </aside>
    );
  }

  // Inside the sheet (below lg) the note opens the details.
  return (
    <div data-slot="why-this-step" className={cn('space-y-1', className)}>
      <Typography variant="marginNote" className="max-w-[68ch]">
        {copy.why}
      </Typography>
      {detail}
    </div>
  );
};

export { WhyThisStep };
