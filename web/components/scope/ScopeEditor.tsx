'use client';

import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { ClassMark } from '@/components/ui/ClassMark';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Typography } from '@/components/ui/Typography';
import { SCOPE } from '@/content/scope';
import { type Preset, TOPIC_CLASSES, type TopicClass } from '@/lib/scope/types';

import { ClassTag } from './ClassTag';

const E = SCOPE.editor;

type ScopeEditorProps = {
  preset: Preset;
  edit: Record<string, TopicClass>;
  disabled: boolean;
  onChange: (edit: Record<string, TopicClass>) => void;
};

// The preset's scope definition, one topic per row with a three-way switch. Moving a topic
// relabels its prompts for the vote and the keyword rules; the two recorded judges then step aside.
const ScopeEditor = ({ preset, edit, disabled, onChange }: ScopeEditorProps) => {
  const classOf = (topic: Preset['topics'][number]) => edit[topic.id] ?? topic.class;
  const editable = preset.topics.filter((t) => t.class !== 'injection');
  const count = (cls: TopicClass) => editable.filter((t) => classOf(t) === cls).length;
  const moved = Object.keys(edit).length;

  const move = (topic: string, original: string, cls: string) => {
    const rest = Object.fromEntries(Object.entries(edit).filter(([id]) => id !== topic));
    onChange(cls === original ? rest : { ...rest, [topic]: cls as TopicClass });
  };

  return (
    <Collapsible className="rounded-md border bg-card">
      <CollapsibleTrigger className="group flex min-h-12 w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2 text-left">
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-primary transition-transform group-data-[state=open]:rotate-90"
        />
        <Typography variant="stepHeading" as="span" className="text-base">
          {E.title}
        </Typography>
        <span className="voice-data text-xs text-muted-foreground">
          {E.summary(count('in'), count('adjacent'), count('out'))}
        </span>
        {moved > 0 && <span className="voice-pencil text-sm text-primary">{E.moved(moved)}</span>}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t border-dashed px-4 pt-3 pb-4">
        <Typography variant="small" color="muted" className="max-w-[68ch]">
          {E.intro}
        </Typography>
        <ul className="divide-y divide-dashed">
          {editable.map((topic) => {
            const current = classOf(topic);
            const labelId = `topic-${topic.id}`;
            return (
              <li
                key={topic.id}
                className="grid gap-x-4 gap-y-1.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <span id={labelId} className="flex flex-wrap items-center gap-x-2 text-sm">
                    <ClassMark label={current} />
                    <span className="font-medium">{topic.name}</span>
                    {current !== topic.class && (
                      <span className="voice-pencil text-xs text-primary">
                        {E.changedFrom(SCOPE.labels[topic.class])}
                      </span>
                    )}
                  </span>
                  <span className="voice-data block truncate text-xs text-muted-foreground">
                    {E.keywords}: {topic.keywords.join(', ')}
                  </span>
                </div>
                <SegmentedControl
                  name={`topic-${preset.id}-${topic.id}`}
                  labelledBy={labelId}
                  size="sm"
                  value={current}
                  disabled={disabled}
                  onChange={(cls) => move(topic.id, topic.class, cls)}
                  options={TOPIC_CLASSES.map((cls) => ({
                    value: cls,
                    label: <ClassTag label={cls} short />,
                  }))}
                />
              </li>
            );
          })}
          <li className="flex flex-wrap items-center gap-x-2 py-2.5 text-sm text-muted-foreground">
            <ClassTag label="injection" />
            <span>{E.injection}</span>
          </li>
        </ul>
        {moved > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-dashed pt-3">
            <Typography variant="marginNote">{E.judgeSkipped}</Typography>
            <Button
              type="button"
              variant="pencil"
              size="inline"
              disabled={disabled}
              className="min-h-8 text-sm"
              onClick={() => onChange({})}
            >
              {E.reset}
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export { ScopeEditor };
