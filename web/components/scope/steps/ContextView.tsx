import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import type { ContextData, SkippedData, Turn } from '@/lib/scope/types';
import { cn } from '@/lib/utils';

const F = SCOPE.steps.context;

type TurnsProps = { turns: Turn[]; muted?: boolean };

// Earlier turns as a short transcript: the role in the data voice, the words as written.
const Turns = ({ turns, muted }: TurnsProps) => {
  return (
    <ol
      className={cn(
        'max-w-[72ch] space-y-1 border-y border-dashed py-2 text-sm',
        muted && 'text-muted-foreground',
      )}
    >
      {turns.map((turn, i) => (
        <li key={i} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2">
          <span className="voice-data text-xs leading-5 text-muted-foreground">{turn.role}</span>
          <span className="break-words">{turn.text}</span>
        </li>
      ))}
    </ol>
  );
};

type ContextViewProps = { data: ContextData | SkippedData; skipped: boolean };

const ContextView = ({ data, skipped }: ContextViewProps) => {
  if (skipped) {
    const { reason, turns } = data as SkippedData;
    return (
      <div className="space-y-2">
        <Typography variant="small" color="muted">
          {reason}
        </Typography>
        {turns && turns.length > 0 && (
          <>
            <Typography variant="label" color="muted" as="p">
              {F.notRead}
            </Typography>
            <Turns turns={turns} muted />
          </>
        )}
      </div>
    );
  }
  const { turns, dropped, reading } = data as ContextData;
  return (
    <div className="space-y-2">
      <Turns turns={turns} />
      {dropped > 0 && (
        <Typography variant="small" color="muted">
          {F.dropped(dropped)}
        </Typography>
      )}
      <Typography variant="label" color="muted" as="p">
        {F.reading}
      </Typography>
      <pre className="voice-data relative overflow-x-auto rounded-sm border border-dashed px-3 py-2 text-xs leading-relaxed break-words whitespace-pre-wrap">
        {reading}
      </pre>
    </div>
  );
};

export { ContextView, Turns };
