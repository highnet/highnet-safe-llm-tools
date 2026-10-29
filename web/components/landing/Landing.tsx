import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { buttonVariants } from '@/components/ui/Button';
import { ClassMark } from '@/components/ui/ClassMark';
import { Typography } from '@/components/ui/Typography';
import { COPY } from '@/content/copy';
import { LANDING } from '@/content/landing';
import { SCOPE_STAGE_ORDER, SCOPE_STAGES } from '@/content/scope-stages';
import { SCOPE_ACTIONS, type ScopeAction } from '@/content/scope-verdict';
import { SITE } from '@/content/site';
import { STAGE_ORDER, STAGES } from '@/content/stages';
import { formatNumber, pad2 } from '@/lib/format';
import { scopeRunHref, type ScopeVerdict, verdictForExample } from '@/lib/scope-verdicts';
import { questionHref } from '@/lib/url-state';

const ACTIONS: ScopeAction[] = ['answer', 'answer_briefly', 'redirect', 'block'];

type StepChainProps = {
  steps: string[];
  label: string;
  end: ReactNode;
};

// A product's real steps as numbered ruled boxes, in the order a message meets them.
const StepChain = ({ steps, label, end }: StepChainProps) => {
  return (
    <ol aria-label={label} className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />}
          <span className="inline-flex items-baseline gap-2 rounded-sm border bg-card px-2.5 py-1 text-sm">
            <span className="voice-data text-xs text-muted-foreground">{pad2(i + 1)}</span>
            {step}
          </span>
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
        {end}
      </li>
    </ol>
  );
};

type ProductSheetProps = {
  id: 'rag' | 'scope';
  lede: string;
  takeaway: string;
  open: string;
  secondary: { href: string; text: string };
  figure: ReactNode;
};

const ProductSheet = ({ id, lede, takeaway, open, secondary, figure }: ProductSheetProps) => {
  const product = SITE.products[id];
  return (
    <article
      aria-labelledby={`product-${id}`}
      className="grid gap-x-12 gap-y-5 border-t pt-6 md:pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="space-y-3">
        <Typography variant="sheetTitle" as="h3" id={`product-${id}`}>
          {product.name}
        </Typography>
        <Typography variant="stepHeading" as="p">
          {product.tagline}
        </Typography>
        <Typography color="muted">{lede}</Typography>
        <Typography variant="marginNote">{takeaway}</Typography>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
          <Link href={product.href} className={buttonVariants({ variant: 'primary' })}>
            {open}
            <ArrowRight aria-hidden />
          </Link>
          <Link
            href={secondary.href}
            className="voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            {secondary.text}
          </Link>
        </div>
      </div>
      <div className="self-center">{figure}</div>
    </article>
  );
};

type VerdictLineProps = {
  verdict?: ScopeVerdict;
};

// One recorded Scope verdict, read from the export; nothing here is typed in by hand.
const VerdictLine = ({ verdict }: VerdictLineProps) => {
  if (!verdict) return null;
  const action = SCOPE_ACTIONS[verdict.action];
  return (
    <Typography variant="data" as="p" className="flex items-center gap-2">
      <ClassMark label={action.label} />
      {LANDING.connect.verdict(action.text, formatNumber(verdict.confidence, 2))}
    </Typography>
  );
};

type WorkedQuestionProps = {
  question: string;
  title: string;
  body: string;
  verdict?: ScopeVerdict;
  links: { href: string; text: string }[];
};

const WorkedQuestion = ({ question, title, body, verdict, links }: WorkedQuestionProps) => {
  return (
    <div className="space-y-2 border-t border-dashed pt-4">
      <Typography variant="data" as="p" className="text-base">
        “{question}”
      </Typography>
      <Typography variant="stepHeading" as="h3">
        {title}
      </Typography>
      <Typography>{body}</Typography>
      <VerdictLine verdict={verdict} />
      <ul className="flex flex-wrap gap-x-5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              {link.text}
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// The shared opening page: what the site is, the two tools as their real step chains, how they
// fit together on two recorded questions, and the argument both tools make.
const Landing = () => {
  const c = LANDING.connect;
  return (
    <>
      <section aria-labelledby="landing-title" className="max-w-4xl space-y-5 pb-10 md:pb-16">
        <Typography variant="display" id="landing-title">
          {LANDING.title}
        </Typography>
        <Typography className="text-lg">{LANDING.intro}</Typography>
      </section>

      <section aria-labelledby="products-title" className="space-y-8 md:space-y-12">
        <Typography variant="label" as="h2" id="products-title" className="sr-only">
          {LANDING.productsTitle}
        </Typography>
        <ProductSheet
          id="rag"
          lede={LANDING.rag.lede}
          takeaway={LANDING.rag.takeaway}
          open={LANDING.rag.open}
          secondary={LANDING.rag.secondary}
          figure={
            <StepChain
              label={SITE.products.rag.name}
              steps={STAGE_ORDER.map((s) => STAGES[s].title)}
              end={
                <span className="inline-flex items-center gap-2 rounded-sm border border-foreground/70 bg-card px-2.5 py-1 text-sm font-semibold">
                  <span aria-hidden className="voice-data text-primary">
                    =
                  </span>
                  {LANDING.rag.result}
                </span>
              }
            />
          }
        />
        <ProductSheet
          id="scope"
          lede={LANDING.scope.lede}
          takeaway={LANDING.scope.takeaway}
          open={LANDING.scope.open}
          secondary={LANDING.scope.secondary}
          figure={
            <StepChain
              label={SITE.products.scope.name}
              steps={SCOPE_STAGE_ORDER.map((s) => SCOPE_STAGES[s].title)}
              end={
                <span className="inline-flex flex-wrap items-center gap-1.5 rounded-sm border border-foreground/70 bg-card px-2.5 py-1 text-sm font-semibold">
                  <span aria-hidden className="voice-data text-primary">
                    =
                  </span>
                  {ACTIONS.map((a, i) => (
                    <span key={a} className="inline-flex items-center gap-1.5">
                      {i > 0 && (
                        <span aria-hidden className="text-muted-foreground">
                          /
                        </span>
                      )}
                      <ClassMark label={SCOPE_ACTIONS[a].label} size="sm" />
                      {LANDING.scope.actions[i]}
                    </span>
                  ))}
                </span>
              }
            />
          }
        />
      </section>

      <section aria-labelledby="connect-title" className="mt-16 space-y-4 md:mt-24">
        <Typography variant="sheetTitle" as="h2" id="connect-title">
          {c.title}
        </Typography>
        <Typography color="muted">{c.lede}</Typography>
        <div className="grid gap-x-12 gap-y-6 pt-2 lg:grid-cols-2">
          <WorkedQuestion
            question={c.worldCup.question}
            title={c.worldCup.title}
            body={c.worldCup.body}
            verdict={verdictForExample('rag-world-cup')}
            links={[
              { href: scopeRunHref('rag-world-cup'), text: c.worldCup.scopeLink },
              { href: questionHref(c.worldCup.question), text: c.worldCup.ragLink },
            ]}
          />
          <WorkedQuestion
            question={c.lasagna.question}
            title={c.lasagna.title}
            body={c.lasagna.body}
            verdict={verdictForExample('rag-lasagna')}
            links={[{ href: scopeRunHref('rag-lasagna'), text: c.lasagna.scopeLink }]}
          />
        </div>
      </section>

      <section aria-labelledby="principles-title" className="mt-16 space-y-4 md:mt-24">
        <Typography variant="sheetTitle" as="h2" id="principles-title">
          {LANDING.principlesTitle}
        </Typography>
        <ul className="max-w-[68ch] divide-y divide-dashed border-y border-dashed">
          {LANDING.principles.map((p) => (
            <li key={p} className="py-3">
              <Typography>{p}</Typography>
            </li>
          ))}
        </ul>
        <Link
          href="/scope/#principles"
          className="voice-pencil inline-flex min-h-10 items-center gap-1 text-sm text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
        >
          {LANDING.principlesLink}
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
        <p className="sr-only">{COPY.tagline}</p>
      </section>
    </>
  );
};

export { Landing };
