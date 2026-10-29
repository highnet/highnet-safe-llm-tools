import { ClassMark } from '@/components/ui/ClassMark';
import { SCOPE } from '@/content/scope';
import { SCOPE_ACTIONS, type ScopeAction } from '@/content/scope-verdict';
import type { Label } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

type ClassTagProps = {
  label: Label;
  // The word to print beside the mark; the class name by default.
  text?: string;
  short?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

// A class is always its shape plus its word, never colour alone.
const ClassTag = ({ label, text, short, size = 'sm', className }: ClassTagProps) => {
  return (
    <span
      data-slot="class-tag"
      className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}
    >
      <ClassMark label={label} size={size} />
      {short ? (
        <>
          <span aria-hidden>{SCOPE.labelsShort[label]}</span>
          <span className="sr-only">{SCOPE.labels[label]}</span>
        </>
      ) : (
        (text ?? SCOPE.labels[label])
      )}
    </span>
  );
};

type ActionTagProps = {
  action: ScopeAction;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

// An action carries the shape of the class it serves: answer = in, brief = adjacent, …
const ActionTag = ({ action, size, className }: ActionTagProps) => {
  const { label, text } = SCOPE_ACTIONS[action];
  return <ClassTag label={label} text={text} size={size} className={className} />;
};

export { ActionTag, ClassTag };
