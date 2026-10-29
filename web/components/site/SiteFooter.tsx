import { Typography } from '@/components/ui/Typography';
import { SITE } from '@/content/site';

const F = SITE.footer;

type FooterColumnProps = {
  id: string;
  title: string;
  links: readonly { href: string; text: string }[];
};

const FooterColumn = ({ id, title, links }: FooterColumnProps) => {
  return (
    <nav aria-labelledby={id}>
      <Typography variant="label" color="muted" as="h2" id={id}>
        {title}
      </Typography>
      <ul className="mt-1">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="-mx-1 inline-flex min-h-8 items-center rounded-sm px-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// The site map (both products), the project links, and the attributions the corpus licence and
// the drafted dataset ask for.
const SiteFooter = () => {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pt-16 pb-10 md:px-8">
      <div className="grid grid-cols-2 gap-x-10 gap-y-6 border-t pt-6 sm:grid-cols-[auto_auto_auto_minmax(0,1fr)]">
        <FooterColumn
          id="footer-rag"
          title={SITE.products.rag.name}
          links={SITE.pages.rag.map(({ href, text }) => ({ href, text }))}
        />
        <FooterColumn
          id="footer-scope"
          title={SITE.products.scope.name}
          links={SITE.pages.scope.map(({ href, text }) => ({ href, text }))}
        />
        <FooterColumn
          id="footer-project"
          title={F.project}
          links={[{ href: '/', text: F.home }, ...F.projectLinks]}
        />
        <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
          <Typography variant="data" as="p" className="font-semibold">
            {SITE.name}
          </Typography>
          <Typography variant="small" color="muted" className="mt-1 max-w-[52ch]">
            {SITE.tagline}
          </Typography>
          <Typography variant="small" color="muted" className="mt-3 max-w-[52ch]">
            {F.corpus}
          </Typography>
          <Typography variant="small" color="muted" className="mt-1 max-w-[52ch]">
            {F.dataset}
          </Typography>
        </div>
      </div>
    </footer>
  );
};

export { SiteFooter };
