import { type ReactNode } from 'react';

import { Disclosure } from '@/components/ui/Disclosure';

export type Fold = { key: string; label: string; content: ReactNode };

type ReportFoldsProps = {
  label: string;
  folds: Fold[];
};

// The rest of a report under its headline: one pencil toggle per group, ruled like a list of
// statements on bare paper, each closed until asked for.
const ReportFolds = ({ label, folds }: ReportFoldsProps) => {
  return (
    <ul aria-label={label} className="divide-y border-y">
      {folds.map((fold) => (
        <li key={fold.key} className="py-2">
          <Disclosure show={fold.label} hide={fold.label}>
            <div className="pt-2 pb-4">{fold.content}</div>
          </Disclosure>
        </li>
      ))}
    </ul>
  );
};

export { ReportFolds };
